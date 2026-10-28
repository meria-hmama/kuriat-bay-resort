import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const systemDark = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: systemDark() ? 'dark' : 'light',
      toggle: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
    }),
    { name: 'kb-theme' },
  ),
)
