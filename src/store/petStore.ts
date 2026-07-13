import { create } from 'zustand';

export interface PetStore {
  kept: number;
  broken: number;
  recordKept: () => void;
  recordBroken: (count: number) => void;
}

export const usePetStore = create<PetStore>((set) => ({
  kept: 0,
  broken: 0,
  recordKept: () => set((s) => ({ kept: s.kept + 1 })),
  recordBroken: (count) => set((s) => ({ broken: s.broken + count })),
}));
