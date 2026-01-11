import AsyncStorage from '@react-native-async-storage/async-storage';

import { createStore, persist } from './createStore';

export interface AppSettingsValues {
  pushNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  hapticsEnabled: boolean;
  soundsEnabled: boolean;
  analyticsEnabled: boolean;
  dataSaverEnabled: boolean;
  biometricLockEnabled: boolean;
}

export type AppSettingsKey = keyof AppSettingsValues;

export interface AppSettingsState extends AppSettingsValues {
  set: (key: AppSettingsKey, value: boolean) => void;
  toggle: (key: AppSettingsKey) => void;
  reset: () => void;
}

const DEFAULTS: AppSettingsValues = {
  pushNotificationsEnabled: true,
  emailNotificationsEnabled: true,
  hapticsEnabled: true,
  soundsEnabled: true,
  analyticsEnabled: true,
  dataSaverEnabled: false,
  biometricLockEnabled: false,
};

function pickPersistedValues(input: any): Partial<AppSettingsValues> {
  const out: Partial<AppSettingsValues> = {};
  if (!input || typeof input !== 'object') return out;

  const keys = Object.keys(DEFAULTS) as Array<AppSettingsKey>;
  for (const key of keys) {
    const value = input[key];
    if (typeof value === 'boolean') out[key] = value;
  }
  return out;
}

export const useAppSettingsStore = createStore<AppSettingsState>(
  persist(
    (set, get) => ({
      ...DEFAULTS,

      set: (key, value) => set({ [key]: value } as any),

      toggle: (key) => {
        const current = get()[key];
        set({ [key]: !current } as any);
      },

      reset: () => set({ ...DEFAULTS } as any),
    }),
    {
      name: 'app-settings-storage',
      storage: AsyncStorage,
      merge: (persisted, current) => {
        const persistedValues = pickPersistedValues(persisted);
        return { ...current, ...persistedValues };
      },
    }
  )
);
