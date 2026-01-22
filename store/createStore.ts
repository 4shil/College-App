// Simple zustand-like store implementation using React
// No external dependencies, works everywhere

import { useState, useEffect, useCallback, useMemo } from 'react';

type SetState<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
type GetState<T> = () => T;
type StoreApi<T> = {
  getState: GetState<T>;
  setState: SetState<T>;
  subscribe: (listener: () => void) => () => void;
};

type StateCreator<T> = (set: SetState<T>, get: GetState<T>, api: StoreApi<T>) => T;

export function createStore<T extends object>(createState: StateCreator<T>) {
  let state: T;
  const listeners = new Set<() => void>();

  const getState: GetState<T> = () => state;

  const setState: SetState<T> = (partial) => {
    const nextState = typeof partial === 'function' ? partial(state) : partial;
    if (!Object.is(nextState, state)) {
      state = { ...state, ...nextState };
      listeners.forEach((listener) => listener());
    }
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const api: StoreApi<T> = { getState, setState, subscribe };
  state = createState(setState, getState, api);

  // Return a hook
  function useStore(): T;
  function useStore<U>(selector: (state: T) => U): U;
  function useStore<U>(selector?: (state: T) => U) {
    const [, forceUpdate] = useState({});

    useEffect(() => {
      const unsubscribe = subscribe(() => forceUpdate({}));
      return () => { unsubscribe(); };
    }, []);

    return selector ? selector(state) : state;
  }

  // Attach API to hook
  useStore.getState = getState;
  useStore.setState = setState;
  useStore.subscribe = subscribe;

  return useStore;
}

// Persist middleware (simplified)
export function persist<T extends object>(
  createState: StateCreator<T>,
  options: {
    name: string;
    storage?: any;
    merge?: (persistedState: any, currentState: T) => Partial<T>;
  }
) {
  return (set: SetState<T>, get: GetState<T>, api: StoreApi<T>): T => {
    const storage = options.storage || {
      getItem: (key: string) => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            return Promise.resolve(window.localStorage.getItem(key));
          }
        } catch (err) {
          // localStorage may be unavailable (SSR, private browsing)
          if (__DEV__) console.warn('[persist] localStorage read failed:', err);
        }
        return Promise.resolve(null);
      },
      setItem: (key: string, value: string) => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(key, value);
          }
        } catch (err) {
          // localStorage may be unavailable or full
          if (__DEV__) console.warn('[persist] localStorage write failed:', err);
        }
        return Promise.resolve();
      },
    };

    // Load persisted state
    const loadState = async () => {
      try {
        const stored = await storage.getItem(options.name);
        if (stored) {
          const parsed = JSON.parse(stored);
          const current = get();
          const merged = options.merge ? options.merge(parsed, current) : parsed;
          set(merged);
        }
      } catch (err) {
        // Parsing or loading failed - start with fresh state
        if (__DEV__) console.warn('[persist] Failed to load state for', options.name, err);
      }
    };

    // Wrap set to persist on change
    const persistSet: SetState<T> = (partial) => {
      set(partial);
      try {
        const currentState = get();
        storage.setItem(options.name, JSON.stringify(currentState));
      } catch (err) {
        // Serialization or storage failed
        if (__DEV__) console.warn('[persist] Failed to persist state for', options.name, err);
      }
    };

    // Load on init
    loadState();

    return createState(persistSet, get, api);
  };
}
