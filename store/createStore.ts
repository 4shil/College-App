// Simple zustand-like store implementation using React
// No external dependencies, works everywhere

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

type SetState<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
type GetState<T> = () => T;
type StoreApi<T> = {
  getState: GetState<T>;
  setState: SetState<T>;
  subscribe: (listener: () => void) => () => void;
};

type StateCreator<T> = (set: SetState<T>, get: GetState<T>, api: StoreApi<T>) => T;

// Shallow equality check for objects
function shallowEqual<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    return false;
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key) || !Object.is((a as any)[key], (b as any)[key])) {
      return false;
    }
  }
  return true;
}

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

  // Return a hook with optimized selector support
  function useStore(): T;
  function useStore<U>(selector: (state: T) => U, equalityFn?: (a: U, b: U) => boolean): U;
  function useStore<U>(selector?: (state: T) => U, equalityFn: (a: U, b: U) => boolean = Object.is) {
    const [, forceUpdate] = useState({});
    
    // Track previous selected value to avoid unnecessary re-renders
    const selectorRef = useRef(selector);
    const equalityFnRef = useRef(equalityFn);
    const prevSelectedRef = useRef<U | T>();
    
    // Update refs on each render
    selectorRef.current = selector;
    equalityFnRef.current = equalityFn;

    // Initialize previous value
    if (prevSelectedRef.current === undefined) {
      prevSelectedRef.current = selector ? selector(state) : state;
    }

    useEffect(() => {
      const unsubscribe = subscribe(() => {
        const currentSelector = selectorRef.current;
        const currentEqualityFn = equalityFnRef.current;
        
        // Get new selected value
        const newSelected = currentSelector ? currentSelector(state) : state;
        const prevSelected = prevSelectedRef.current;
        
        // Only re-render if selected value changed
        if (!currentEqualityFn(newSelected as U, prevSelected as U)) {
          prevSelectedRef.current = newSelected;
          forceUpdate({});
        }
      });
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

// Export shallowEqual for use in selectors that return objects
export { shallowEqual };

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
