import { create } from 'zustand';
import type { Colors, Fonts } from '../types';

const setCSSVar = (name: string, value: string) =>
  document.documentElement.style.setProperty(name, value);

interface SettingsState {
  storeName: string;
  footerContact: string;
  colors: Colors;
  fonts: Fonts;
  bgImage: string | null;
  bgImageOpacity: number;
  updateStoreName: (v: string) => void;
  updateContact: (v: string) => void;
  updateColor: (type: keyof Colors, value: string) => void;
  updateFont: (type: keyof Fonts, value: string) => void;
  setBgImage: (file: File | null) => void;
  setBgImageOpacity: (v: number) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  storeName: 'CATÁLOGO HOGAR & DECO',
  footerContact: 'Contacto: ventas@tutienda.com | WhatsApp: +54 9 11 2345-6789',
  colors: { bg: '#fafafa', primary: '#4f5e4f', secondary: '#d9c3b0', text: '#374151' },
  fonts: {
    heading: 'Arial, Helvetica, sans-serif',
    body: 'Arial, Helvetica, sans-serif',
    small: 'Arial, Helvetica, sans-serif',
  },
  bgImage: null,
  bgImageOpacity: 0.15,

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
}));
