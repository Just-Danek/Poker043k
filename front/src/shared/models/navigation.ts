import { create } from 'zustand';
import type { Screen } from '../api/game';

interface NavigationState {
    currentScreen: Screen;
    goTo: (screen: Screen) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
    currentScreen: 'menu',
    goTo: (screen) => set({ currentScreen: screen }),
}));