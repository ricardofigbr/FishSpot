import React, { createContext, useState, ReactNode } from 'react';

export interface FishingSpot {
  id: string;
  name: string;
  photo: string | null;
  description?: string; // Adicionado para corrigir o erro do mapa
  coordinates?: { lat: number; lng: number };
  userId?: string; 
}

interface SpotsContextData {
  spots: FishingSpot[];
  addSpot: (spot: FishingSpot) => void;
  updateSpot: (spot: FishingSpot) => void;
  deleteSpot: (id: string) => void;

  isModalOpen: boolean;
  isEditing: boolean;
  currentSpot: Partial<FishingSpot> | null;
  validationError: string;
  openForCreation: (coordinates?: { lat: number; lng: number }) => void;
  openForEditing: (spot: FishingSpot) => void;
  closeModal: () => void;
  saveSpot: (formData: Partial<FishingSpot>) => void;
}

export const SpotsContext = createContext<SpotsContextData>({} as SpotsContextData);

export function SpotsProvider({ children }: { children: ReactNode }) {
  const [spots, setSpots] = useState<FishingSpot[]>([]);
  
  // Estados de controle do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSpot, setCurrentSpot] = useState<Partial<FishingSpot> | null>(null);
  const [validationError, setValidationError] = useState('');

  // Lógica CRUD básica
  const addSpot = (spot: FishingSpot) => setSpots([...spots, spot]);
  const updateSpot = (updatedSpot: FishingSpot) => {
    setSpots(spots.map(spot => spot.id === updatedSpot.id ? updatedSpot : spot));
  };
  const deleteSpot = (id: string) => setSpots(spots.filter(spot => spot.id !== id));

  // Lógica de abertura do Modal
  const openForCreation = (coordinates?: { lat: number; lng: number }) => {
    setCurrentSpot({ coordinates, name: '', photo: null, description: '' });
    setIsEditing(false);
    setValidationError('');
    setIsModalOpen(true);
  };

  const openForEditing = (spot: FishingSpot) => {
    setCurrentSpot(spot);
    setIsEditing(true);
    setValidationError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentSpot(null);
    setValidationError('');
  };

  // Regra de validação para salvar (Obrigatório: Nome e Foto)
  const saveSpot = (formData: Partial<FishingSpot>) => {
    if (!formData.name?.trim() || !formData.photo) {
      setValidationError('Nome e foto são obrigatórios!');
      return;
    }

    setValidationError('');

    const finalSpot = {
      ...currentSpot,
      ...formData,
      id: currentSpot?.id || Date.now().toString(),
    } as FishingSpot;

    if (isEditing) {
      updateSpot(finalSpot);
    } else {
      addSpot(finalSpot);
    }

    closeModal();
  };

  return (
    <SpotsContext.Provider value={{
      spots, addSpot, updateSpot, deleteSpot,
      isModalOpen, isEditing, currentSpot, validationError,
      openForCreation, openForEditing, closeModal, saveSpot
    }}>
      {children}
    </SpotsContext.Provider>
  );
}