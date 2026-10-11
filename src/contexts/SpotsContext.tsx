import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
  useCallback,
  useRef,
} from 'react';
import * as Location from 'expo-location';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { firestore } from '../services/firebase';
import { firebaseEmailToUsername } from '../services/firebaseAuth';
import { fetchNearestIscaboxSpots } from '../services/iscaboxApi';
import type { Coordinates, IscaboxSpot } from '../services/iscaboxApi';

export interface FishingSpot {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  image?: string;
  photos?: string[];
  createdAt: string;
}

export interface NewSpotData {
  latitude: number;
  longitude: number;
  name: string;
  description?: string;
  image?: string;
  photos?: string[];
}

export interface SpotsContextData {
  spots: FishingSpot[];
  spotsLoading: boolean;
  spotsPendingWrites: boolean;
  spotsError: string | null;
  iscaboxSpots: IscaboxSpot[];
  iscaboxLoading: boolean;
  iscaboxHasLoaded: boolean;
  iscaboxError: string | null;
  currentUser: string | null;
  addSpot: (spotData: NewSpotData) => Promise<void>;
  updateSpot: (id: string, name: string, description: string, image?: string, photos?: string[]) => Promise<void>;
  deleteSpot: (id: string) => Promise<void>;
  refreshIscaboxSpots: (coordinates?: Coordinates, force?: boolean) => Promise<void>;
}

export const SpotsContext = createContext<SpotsContextData>({} as SpotsContextData);

function getFirestoreErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : '';

  if (code.endsWith('permission-denied')) {
    return 'O Firebase negou o acesso aos pontos. Publique as regras de firestore.rules em Firestore Database > Regras e confirme que o app está no projeto correto.';
  }

  if (code.endsWith('unauthenticated')) {
    return 'A sessão do Firebase não foi reconhecida. Entre novamente na sua conta e tente outra vez.';
  }

  if (code.endsWith('unavailable') || code.endsWith('deadline-exceeded')) {
    return 'Não foi possível conectar ao Firestore. Verifique a internet e tente novamente. Gravações pendentes ficam disponíveis apenas enquanto esta sessão do app permanecer aberta.';
  }

  return 'O Firestore não confirmou a operação. Verifique a configuração do Firebase e tente novamente.';
}

export const SpotsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [spots, setSpots] = useState<FishingSpot[]>([]);
  const [spotsOwnerUid, setSpotsOwnerUid] = useState<string | null>(null);
  const [pendingWritesOwnerUid, setPendingWritesOwnerUid] = useState<string | null>(null);
  const [spotsPendingWritesValue, setSpotsPendingWritesValue] = useState(false);
  const [spotsErrorState, setSpotsErrorState] = useState<{ uid: string; message: string } | null>(null);
  const [iscaboxSpots, setIscaboxSpots] = useState<IscaboxSpot[]>([]);
  const [iscaboxLoading, setIscaboxLoading] = useState(false);
  const [iscaboxHasLoaded, setIscaboxHasLoaded] = useState(false);
  const [iscaboxError, setIscaboxError] = useState<string | null>(null);
  const lastIscaboxFetchAt = useRef(0);
  const iscaboxRequest = useRef<Promise<void> | null>(null);
  const currentUser = user ? firebaseEmailToUsername(user.email) : null;
  const spotsLoading = Boolean(user && firestore && spotsOwnerUid !== user.uid && spotsErrorState?.uid !== user.uid);
  const spotsPendingWrites = Boolean(
    user && pendingWritesOwnerUid === user.uid && spotsPendingWritesValue,
  );
  const spotsError = !user
    ? null
    : !firestore
      ? 'Configure o Firebase e o Cloud Firestore para carregar seus pontos.'
      : spotsErrorState?.uid === user.uid
        ? spotsErrorState.message
        : null;
  const visibleSpots = user && spotsOwnerUid === user.uid ? spots : [];

  useEffect(() => {
    if (!user || !firestore) return;

    const userSpots = collection(firestore, 'users', user.uid, 'spots');
    return onSnapshot(
      userSpots,
      { includeMetadataChanges: true },
      (snapshot) => {
        const nextSpots = snapshot.docs
          .map((spotDocument) => {
            const data = spotDocument.data();
            return {
              id: spotDocument.id,
              name: typeof data.name === 'string' ? data.name : '',
              description: typeof data.description === 'string' ? data.description : '',
              latitude: Number(data.latitude),
              longitude: Number(data.longitude),
              image: typeof data.image === 'string' ? data.image : undefined,
              photos: Array.isArray(data.photos)
                ? data.photos.filter((photo): photo is string => typeof photo === 'string')
                : [],
              createdAt: typeof data.createdAt === 'string' ? data.createdAt : '',
            } satisfies FishingSpot;
          })
          .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

        setSpots(nextSpots);
        setSpotsOwnerUid(user.uid);
        setPendingWritesOwnerUid(user.uid);
        setSpotsPendingWritesValue(snapshot.metadata.hasPendingWrites);
        setSpotsErrorState(null);
      },
      (error) => {
        console.error('Erro ao carregar os pontos do Firestore:', error);
        setSpotsOwnerUid(user.uid);
        setSpotsErrorState({
          uid: user.uid,
          message: getFirestoreErrorMessage(error),
        });
      },
    );
  }, [user]);

  const refreshIscaboxSpots = useCallback(
    async (coordinates?: Coordinates, force = false) => {
      if (
        !force &&
        iscaboxHasLoaded &&
        lastIscaboxFetchAt.current > 0 &&
        Date.now() - lastIscaboxFetchAt.current < 120_000
      ) {
        return;
      }
      if (iscaboxRequest.current) {
        return iscaboxRequest.current;
      }

      const request = (async () => {
        setIscaboxLoading(true);
        setIscaboxError(null);
        try {
          let searchCoordinates = coordinates;
          if (!searchCoordinates) {
            const permission = await Location.requestForegroundPermissionsAsync();
            if (permission.status !== 'granted') {
              throw new Error('Permita o acesso à localização para buscar pontos próximos.');
            }
            const position = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            searchCoordinates = position.coords;
          }

          const nearestSpots = await fetchNearestIscaboxSpots(searchCoordinates);
          setIscaboxSpots(nearestSpots);
          setIscaboxHasLoaded(true);
          lastIscaboxFetchAt.current = Date.now();
        } catch (error) {
          setIscaboxHasLoaded(true);
          setIscaboxError(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar os pontos de pesca.',
          );
        } finally {
          setIscaboxLoading(false);
        }
      })();

      iscaboxRequest.current = request;
      try {
        await request;
      } finally {
        if (iscaboxRequest.current === request) iscaboxRequest.current = null;
      }
    },
    [iscaboxHasLoaded],
  );

  const addSpot = useCallback(async (spotData: NewSpotData) => {
    if (!user || !firestore) {
      throw new Error('Entre em uma conta Firebase para salvar um ponto.');
    }

    const userSpots = collection(firestore, 'users', user.uid, 'spots');
    const newSpotReference = doc(userSpots);
    const write = setDoc(newSpotReference, {
      name: spotData.name,
      description: spotData.description ?? '',
      latitude: spotData.latitude,
      longitude: spotData.longitude,
      image: spotData.image ?? null,
      photos: spotData.photos ?? [],
      createdAt: new Date().toISOString(),
    });
    void write.catch((error) => {
      console.error('Erro ao sincronizar o ponto com o Firestore:', error);
      setSpotsErrorState({
        uid: user.uid,
        message: getFirestoreErrorMessage(error),
      });
    });
  }, [user]);

  const updateSpot = useCallback(async (
    id: string,
    name: string,
    description: string,
    image?: string,
    photos?: string[],
  ) => {
    if (!user || !firestore) {
      throw new Error('Entre em uma conta Firebase para editar um ponto.');
    }

    const spotReference = doc(firestore, 'users', user.uid, 'spots', id);
    const write = updateDoc(spotReference, {
      name,
      description,
      image: image ?? null,
      photos: photos ?? [],
    });
    void write.catch((error) => {
      console.error('Erro ao sincronizar a edição com o Firestore:', error);
      setSpotsErrorState({
        uid: user.uid,
        message: getFirestoreErrorMessage(error),
      });
    });
  }, [user]);

  const deleteSpot = useCallback(async (id: string) => {
    if (!user || !firestore) {
      throw new Error('Entre em uma conta Firebase para excluir um ponto.');
    }

    const write = deleteDoc(doc(firestore, 'users', user.uid, 'spots', id));
    void write.catch((error) => {
      console.error('Erro ao sincronizar a exclusão com o Firestore:', error);
      setSpotsErrorState({
        uid: user.uid,
        message: getFirestoreErrorMessage(error),
      });
    });
  }, [user]);

  return (
    <SpotsContext.Provider
      value={{
        spots: visibleSpots,
        spotsLoading,
        spotsPendingWrites,
        spotsError,
        iscaboxSpots,
        iscaboxLoading,
        iscaboxHasLoaded,
        iscaboxError,
        currentUser,
        addSpot,
        updateSpot,
        deleteSpot,
        refreshIscaboxSpots,
      }}
    >
      {children}
    </SpotsContext.Provider>
  );
};

export const useSpots = () => useContext(SpotsContext);
