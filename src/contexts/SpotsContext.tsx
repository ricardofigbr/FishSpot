import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  currentUser: string | null;
  addSpot: (spotData: NewSpotData) => void;
  updateSpot: (id: string, name: string, description: string, image?: string, photos?: string[]) => void;
  deleteSpot: (id: string) => void;
  refreshSpots: () => void;
}

export const SpotsContext = createContext<SpotsContextData>({} as SpotsContextData);

export const SpotsProvider = ({ children }: { children: ReactNode }) => {
  const [spots, setSpots] = useState<FishingSpot[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const loadSpotsAndUser = async () => {
    try {
      const savedUserJson = await AsyncStorage.getItem('@fishspot_user');
      if (savedUserJson) {
        const parsedUser = JSON.parse(savedUserJson);
        setCurrentUser(parsedUser.username || parsedUser.name || 'usuario');
      } else {
        setCurrentUser(null);
      }

      const storedData = await AsyncStorage.getItem('@fishspot_spots');
      if (storedData) {
        setSpots(JSON.parse(storedData));
      } else {
        setSpots([]);
      }
    } catch (error) {
      console.error('Erro ao carregar os pontos do storage:', error);
    }
  };

  useEffect(() => {
    loadSpotsAndUser();
  }, []);

  const saveAndSetSpots = async (updatedSpots: FishingSpot[]) => {
    try {
      setSpots(updatedSpots);
      await AsyncStorage.setItem('@fishspot_spots', JSON.stringify(updatedSpots));
    } catch (error) {
      console.error('Erro ao salvar os pontos no storage:', error);
    }
  };

  const addSpot = (spotData: NewSpotData) => {
    const newSpot: FishingSpot = {
      id: Date.now().toString(),
      name: spotData.name,
      description: spotData.description || '',
      latitude: spotData.latitude,
      longitude: spotData.longitude,
      image: spotData.image,
      photos: spotData.photos || [],
      createdAt: new Date().toLocaleDateString('pt-BR'),
    };
    const updatedSpots = [newSpot, ...spots];
    saveAndSetSpots(updatedSpots);
  };

  const updateSpot = (id: string, name: string, description: string, image?: string, photos?: string[]) => {
    const updatedSpots = spots.map((spot) =>
      spot.id === id
        ? { ...spot, name, description, image, photos: photos || [] }
        : spot
    );
    saveAndSetSpots(updatedSpots);
  };

  const deleteSpot = (id: string) => {
    const updatedSpots = spots.filter((spot) => spot.id !== id);
    saveAndSetSpots(updatedSpots);
  };

  return (
    <SpotsContext.Provider value={{ spots, currentUser, addSpot, updateSpot, deleteSpot, refreshSpots: loadSpotsAndUser }}>
      {children}
    </SpotsContext.Provider>
  );
};

export const useSpots = () => useContext(SpotsContext);