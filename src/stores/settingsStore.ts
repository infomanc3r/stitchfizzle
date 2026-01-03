import { create } from 'zustand';
import type { AppSettings } from '@/types';
import { DEFAULT_APP_SETTINGS } from '@/types';
import { getAppSettings, saveAppSettings } from '@/services/db';

interface SettingsState {
  settings: AppSettings;
  loaded: boolean;

  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;

  // Convenience getters
  isDarkMode: () => boolean;
  toggleDarkMode: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_APP_SETTINGS,
  loaded: false,

  loadSettings: async () => {
    const saved = await getAppSettings();
    if (saved) {
      set({ settings: saved, loaded: true });
      // Apply dark mode to document
      if (saved.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      set({ loaded: true });
    }
  },

  updateSettings: async (updates) => {
    const { settings } = get();
    const newSettings = { ...settings, ...updates };
    set({ settings: newSettings });
    await saveAppSettings(newSettings);

    // Apply dark mode changes immediately
    if ('darkMode' in updates) {
      if (updates.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  },

  resetSettings: async () => {
    set({ settings: DEFAULT_APP_SETTINGS });
    await saveAppSettings(DEFAULT_APP_SETTINGS);
    document.documentElement.classList.remove('dark');
  },

  isDarkMode: () => get().settings.darkMode,

  toggleDarkMode: async () => {
    const { settings, updateSettings } = get();
    await updateSettings({ darkMode: !settings.darkMode });
  },
}));
