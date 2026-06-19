import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Colors, Fonts, GridShape } from '../types';

const setCSSVar = (name: string, value: string) =>
  document.documentElement.style.setProperty(name, value);

function applyColors(colors: Colors) {
  Object.entries(colors).forEach(([k, v]) => setCSSVar(`--page-${k}`, v));
}

function applyFonts(fonts: Fonts) {
  Object.entries(fonts).forEach(([k, v]) => setCSSVar(`--font-${k}`, v));
}

function hexToRgba(v: string): string {
  if (!v.startsWith('#')) return v;
  let hex = v.slice(1);
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},1)`;
}

interface SettingsState {
  storeName: string;
  footerContact: string;
  colors: Colors;
  fonts: Fonts;
  bgImage: string | null;
  bgImageOpacity: number;
  itemsPerPage: number;
  pageLayouts: Record<number, GridShape>;
  updateStoreName: (v: string) => void;
  updateContact: (v: string) => void;
  updateColor: (type: keyof Colors, value: string) => void;
  updateFont: (type: keyof Fonts, value: string) => void;
  setBgImage: (file: File | null) => void;
  setBgImageOpacity: (v: number) => void;
  setItemsPerPage: (n: number) => void;
  setPageLayout: (pageIndex: number, shape: GridShape) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      storeName: 'CATÁLOGO HOGAR & DECO',
      footerContact: 'Contacto: ventas@tutienda.com | WhatsApp: +54 9 11 2345-6789',
      colors: {
        bg: 'rgba(250,250,250,1)',
        primary: 'rgba(79,94,79,1)',
        secondary: 'rgba(217,195,176,1)',
        text: 'rgba(55,65,81,1)',
      },
      fonts: {
        heading: 'Arial, Helvetica, sans-serif',
        body: 'Arial, Helvetica, sans-serif',
        small: 'Arial, Helvetica, sans-serif',
      },
      bgImage: null,
      bgImageOpacity: 0.15,
      itemsPerPage: 3,
      pageLayouts: {},

      updateStoreName: (v) => set({ storeName: v.toUpperCase() }),
      updateContact: (v) => set({ footerContact: v }),

      updateColor: (type, value) => {
        setCSSVar(`--page-${type}`, value);
        set((s) => ({ colors: { ...s.colors, [type]: value } }));
      },

      updateFont: (type, value) => {
        setCSSVar(`--font-${type}`, value);
        set((s) => ({ fonts: { ...s.fonts, [type]: value } }));
      },

      setBgImage: (file) =>
        set((s) => {
          if (s.bgImage) URL.revokeObjectURL(s.bgImage);
          return { bgImage: file ? URL.createObjectURL(file) : null };
        }),

      setBgImageOpacity: (v) => set({ bgImageOpacity: v }),

      setItemsPerPage: (n) => set({ itemsPerPage: n, pageLayouts: {} }),

      setPageLayout: (pageIndex, shape) =>
        set((s) => ({ pageLayouts: { ...s.pageLayouts, [pageIndex]: shape } })),
    }),
    {
      name: 'catalogmaker-settings',
      version: 1,
      migrate: (state: any, version) => {
        if (version === 0 && state?.colors) {
          return {
            ...state,
            colors: {
              bg: hexToRgba(state.colors.bg ?? '#fafafa'),
              primary: hexToRgba(state.colors.primary ?? '#4f5e4f'),
              secondary: hexToRgba(state.colors.secondary ?? '#d9c3b0'),
              text: hexToRgba(state.colors.text ?? '#374151'),
            },
          };
        }
        return state;
      },
      partialize: (s) => ({
        storeName: s.storeName,
        footerContact: s.footerContact,
        colors: s.colors,
        fonts: s.fonts,
        bgImageOpacity: s.bgImageOpacity,
        itemsPerPage: s.itemsPerPage,
        pageLayouts: s.pageLayouts,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        applyColors(state.colors);
        applyFonts(state.fonts);
      },
    }
  )
);
