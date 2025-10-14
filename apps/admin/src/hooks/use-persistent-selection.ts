import { useEffect, useState } from "react";

const STORAGE_KEY_PREFIX = "attendance_selection";

const resolveStorageKey = (key: string) => `${STORAGE_KEY_PREFIX}:${key}`;

export const usePersistentSelection = <T extends string | undefined>(
  key: string,
  initialValue?: T
) => {
  const storageKey = resolveStorageKey(key);
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue as T;
    }
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored) as T;
      }
    } catch {
      // ignore
    }
    return initialValue as T;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      if (value === undefined || value === null) {
        window.localStorage.removeItem(storageKey);
      } else {
        window.localStorage.setItem(storageKey, JSON.stringify(value));
      }
    } catch {
      // ignore
    }
  }, [storageKey, value]);

  const clear = () => setValue(undefined as T);

  return { value, setValue, clear } as const;
};
