import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ComputerSelection { computerId: string; selectComputer: (computerId: string) => void; }
export const useComputerSelection = create<ComputerSelection>()(persist(
  set => ({ computerId: '', selectComputer: computerId => set({ computerId }) }), { name: 'cloudos-selected-computer' },
));
