import { create } from 'zustand';
import type { PetId } from '../ui/pets';

export interface PetSelectionStore {
  petId: PetId;
  setPetId: (id: PetId) => void;
}

export const usePetSelectionStore = create<PetSelectionStore>((set) => ({
  petId: 'pip',
  setPetId: (id) => set({ petId: id }),
}));
