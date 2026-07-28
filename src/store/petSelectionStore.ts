import { create } from 'zustand';
import { PET_DEFS, PetId } from '../ui/pets';
import { SQLiteSettingsRepository } from './settingsRepository';

const PET_ID_KEY = 'petId';

export interface PetSelectionStore {
  petId: PetId;
  setPetId: (id: PetId) => void;
}

function isPetId(value: string | undefined): value is PetId {
  return value !== undefined && value in PET_DEFS;
}

const repository = new SQLiteSettingsRepository();

/**
 * Seeded from the SQLite-backed settings table so the chosen pet survives the
 * app process being killed (force-close), instead of resetting to the
 * default 'pip' on next launch the way an in-memory-only store would.
 */
const storedPetId = repository.get(PET_ID_KEY);

export const usePetSelectionStore = create<PetSelectionStore>((set) => ({
  petId: isPetId(storedPetId) ? storedPetId : 'pip',
  setPetId: (id) => {
    repository.set(PET_ID_KEY, id);
    set({ petId: id });
  },
}));
