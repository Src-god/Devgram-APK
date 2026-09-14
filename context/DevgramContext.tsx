import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type BotSlot = {
  id: number;
  label: string;
  token: string;
  active: boolean;
};

type DevgramState = {
  onboardingComplete: boolean;
  slots: BotSlot[];
  hydrated: boolean;
  completeOnboarding: () => void;
  updateSlot: (id: number, patch: Partial<BotSlot>) => void;
  addSlot: () => void;
  removeSlot: (id: number) => void;
};

const STORAGE_KEY = '@devgram/state';
const defaultSlots: BotSlot[] = [
  { id: 1, label: 'Bot slot 01', token: '', active: false },
];

const DevgramContext = createContext<DevgramState | null>(null);

export function DevgramProvider({ children }: { children: React.ReactNode }) {
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [slots, setSlots] = useState<BotSlot[]>(defaultSlots);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const stored = JSON.parse(raw) as {
          onboardingComplete?: boolean;
          slots?: BotSlot[];
        };
        if (stored.onboardingComplete) setOnboardingComplete(true);
        if (stored.slots?.length) setSlots(stored.slots.slice(0, 10));
      })
      .catch(() => undefined)
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ onboardingComplete, slots }),
    );
  }, [hydrated, onboardingComplete, slots]);

  const value = useMemo<DevgramState>(
    () => ({
      onboardingComplete,
      slots,
      hydrated,
      completeOnboarding: () => setOnboardingComplete(true),
      updateSlot: (id, patch) =>
        setSlots((current) =>
          current.map((slot) => (slot.id === id ? { ...slot, ...patch } : slot)),
        ),
      addSlot: () =>
        setSlots((current) => {
          if (current.length >= 10) return current;
          const nextId = Math.max(...current.map((slot) => slot.id), 0) + 1;
          return [
            ...current,
            { id: nextId, label: `Bot slot ${String(nextId).padStart(2, '0')}`, token: '', active: false },
          ];
        }),
      removeSlot: (id) =>
        setSlots((current) => {
          if (current.length === 1) return current;
          return current.filter((slot) => slot.id !== id);
        }),
    }),
    [hydrated, onboardingComplete, slots],
  );

  return <DevgramContext.Provider value={value}>{children}</DevgramContext.Provider>;
}

export function useDevgram() {
  const value = useContext(DevgramContext);
  if (!value) throw new Error('useDevgram must be used inside DevgramProvider');
  return value;
}