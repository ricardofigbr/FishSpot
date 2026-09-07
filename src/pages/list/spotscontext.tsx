import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FishingSpot {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  image?: string; // Foto principal (ícone menor)
  photos?: string[]; // Galeria de fotos adicionais da descrição
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface SpotsContextData {
  spots: FishingSpot[];
  addSpot: (coords: Coordinates, name?: string, description?: string) => void;
  updateSpot: (id: string, name: string, description: string, image?: string, photos?: string[]) => void;
  deleteSpot: (id: string) => void;
}

export const SpotsContext = createContext<SpotsContextData>({} as SpotsContextData);

export const SpotsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [spots, setSpots] = useState<FishingSpot[]>([]);

  useEffect(() => {
    loadSpots();
  }, []);

  const loadSpots = async (): Promise<void> => {
    try {
      const stored = await AsyncStorage.getItem('@fish_spots');
      if (stored) {
        const parsed = JSON.parse(stored);
        setSpots(Array.isArray(parsed) ? parsed : []);
      }
    } catch (e) {
      console.error(e);
      setSpots([]);
    }
  };

  const saveSpotsToStorage = async (newSpots: FishingSpot[]): Promise<void> => {
    try {
      setSpots(newSpots);
      await AsyncStorage.setItem('@fish_spots', JSON.stringify(newSpots));
    } catch (e) {
      console.error(e);
    }
  };

  const addSpot = (coords: Coordinates, name: string = '', description: string = '') => {
    const newSpot: FishingSpot = {
      id: Date.now().toString(),
      name: name || `Ponto de Pesca #${spots.length + 1}`,
      description: description || 'Sem descrição informada.',
      latitude: coords.latitude,
      longitude: coords.longitude,
      createdAt: new Date().toLocaleDateString('pt-BR'),
      photos: [],
    };
    const updated = [...spots, newSpot];
    saveSpotsToStorage(updated);
  };

  const updateSpot = (id: string, name: string, description: string, image?: string, photos?: string[]) => {
    const updated = spots.map((spot) =>
      spot.id === id ? { 
        ...spot, 
        name, 
        description, 
        ...(image !== undefined ? { image } : {}),
        ...(photos !== undefined ? { photos } : {})
      } : spot
    );
    saveSpotsToStorage(updated);
  };

  const deleteSpot = (id: string) => {
    const updated = spots.filter((spot) => spot.id !== id);
    saveSpotsToStorage(updated);
  };

  return (
    <SpotsContext.Provider value={{ spots, addSpot, updateSpot, deleteSpot }}>
      {children}
    </SpotsContext.Provider>
  );
};