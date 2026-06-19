import { create } from 'zustand';
import type { Colors, Fonts, FontSizes, GridShape } from '../types';
import { loadStoredGoogleFonts } from '../constants/fonts';
import { dbSaveBgImage, dbClearAll, type PersistedSettings } from '../db';

const setCSSVar = (name: string, value: string) =>
  document.documentElement.style.setProperty(name, value);

const COLOR_VAR_MAP: Record<keyof Colors, string> = {
  bg:        '--page-bg',
  company:   '--color-company',
  pageNum:   '--color-page-num',
  divider:   '--color-divider',
  footer:    '--color-footer',
  name:      '--color-name',
  price:     '--color-price',
  desc:      '--color-desc',
  idxTitle:  '--color-idx-title',
  idxText:   '--color-idx-text',
  idxAccent: '--color-idx-accent',
};

const FONT_VAR_MAP: Record<keyof Fonts, string> = {
  company:     '--font-company',
  heading:     '--font-heading',
  price:       '--font-price',
  body:        '--font-body',
  small:       '--font-small',
  pageNum:     '--font-page-num',
  idxTitle:    '--font-idx-title',
  idxSubtitle: '--font-idx-subtitle',
  idxEntry:    '--font-idx-entry',
  idxNum:      '--font-idx-num',
};

const SIZE_VAR_MAP: Record<keyof FontSizes, string> = {
  company:     '--font-size-company',
  heading:     '--font-size-heading',
  price:       '--font-size-price',
  body:        '--font-size-body',
  small:       '--font-size-small',
  pageNum:     '--font-size-page-num',
  idxTitle:    '--font-size-idx-title',
  idxSubtitle: '--font-size-idx-subtitle',
  idxEntry:    '--font-size-idx-entry',
  idxNum:      '--font-size-idx-num',
};

export function applyColors(colors: Colors) {
  (Object.entries(colors) as [keyof Colors, string][]).forEach(([k, v]) => {
    setCSSVar(COLOR_VAR_MAP[k], v);
  });
}

export function applyFonts(fonts: Fonts) {
  (Object.entries(fonts) as [keyof Fonts, string][]).forEach(([k, v]) => {
    setCSSVar(FONT_VAR_MAP[k], v);
  });
}

export function applyFontSizes(fontSizes: FontSizes) {
  (Object.entries(fontSizes) as [keyof FontSizes, number][]).forEach(([k, v]) => {
    setCSSVar(SIZE_VAR_MAP[k], `${v}px`);
  });
}

interface SettingsState {
  storeName: string;
  footerContact: string;
  colors: Colors;
  fonts: Fonts;
  fontSizes: FontSizes;
  bgImage: string | null;
  bgImageOpacity: number;
  itemsPerPage: number;
  pageLayouts: Record<number, GridShape>;
  updateStoreName: (v: string) => void;
  updateContact: (v: string) => void;
  updateColor: (type: keyof Colors, value: string) => void;
  updateFont: (type: keyof Fonts, value: string) => void;
  updateFontSize: (type: keyof FontSizes, value: number) => void;
  setBgImage: (file: File | null) => void;
  setBgImageOpacity: (v: number) => void;
  setItemsPerPage: (n: number) => void;
  setPageLayout: (pageIndex: number, shape: GridShape) => void;
  hydrateSettings: (s: PersistedSettings, bgImageUrl: string | null) => void;
  resetSettings: () => void;
}

export const DEFAULT_FONTS: Fonts = {
  company:     'Arial, Helvetica, sans-serif',
  heading:     'Arial, Helvetica, sans-serif',
  price:       'Arial, Helvetica, sans-serif',
  body:        'Arial, Helvetica, sans-serif',
  small:       'Arial, Helvetica, sans-serif',
  pageNum:     'Arial, Helvetica, sans-serif',
  idxTitle:    'Arial, Helvetica, sans-serif',
  idxSubtitle: 'Arial, Helvetica, sans-serif',
  idxEntry:    'Arial, Helvetica, sans-serif',
  idxNum:      'Arial, Helvetica, sans-serif',
};

export const DEFAULT_FONT_SIZES: FontSizes = {
  company:      10,
  heading:      10,
  price:        12,
  body:          8,
  small:         9,
  pageNum:       9,
  idxTitle:     26,
  idxSubtitle:  11,
  idxEntry:     11,
  idxNum:       10,
};

export const DEFAULT_COLORS: Colors = {
  bg:        'rgba(250,250,250,1)',
  company:   'rgba(100,116,139,1)',
  pageNum:   'rgba(148,163,184,1)',
  divider:   'rgba(217,195,176,1)',
  footer:    'rgba(100,116,139,1)',
  name:      'rgba(79,94,79,1)',
  price:     'rgba(30,41,59,1)',
  desc:      'rgba(55,65,81,1)',
  idxTitle:  'rgba(79,94,79,1)',
  idxText:   'rgba(55,65,81,1)',
  idxAccent: 'rgba(79,94,79,1)',
};

const DEFAULT_STATE = {
  storeName:      'CATÁLOGO HOGAR & DECO',
  footerContact:  'Contacto: ventas@tutienda.com | WhatsApp: +54 9 11 2345-6789',
  colors:         DEFAULT_COLORS,
  fonts:          DEFAULT_FONTS,
  fontSizes:      DEFAULT_FONT_SIZES,
  bgImage:        null as string | null,
  bgImageOpacity: 0.15,
  itemsPerPage:   3,
  pageLayouts:    {} as Record<number, GridShape>,
};

export const useSettingsStore = create<SettingsState>()((set) => ({
  ...DEFAULT_STATE,

  updateStoreName: (v) => set({ storeName: v.toUpperCase() }),
  updateContact:   (v) => set({ footerContact: v }),

  updateColor: (type, value) => {
    setCSSVar(COLOR_VAR_MAP[type], value);
    set((s) => ({ colors: { ...s.colors, [type]: value } }));
  },

  updateFont: (type, value) => {
    setCSSVar(FONT_VAR_MAP[type], value);
    set((s) => ({ fonts: { ...s.fonts, [type]: value } }));
  },

  updateFontSize: (type, value) => {
    setCSSVar(SIZE_VAR_MAP[type], `${value}px`);
    set((s) => ({ fontSizes: { ...s.fontSizes, [type]: value } }));
  },

  setBgImage: (file) =>
    set((s) => {
      if (s.bgImage) URL.revokeObjectURL(s.bgImage);
      dbSaveBgImage(file);
      return { bgImage: file ? URL.createObjectURL(file) : null };
    }),

  setBgImageOpacity: (v) => set({ bgImageOpacity: v }),

  setItemsPerPage: (n) => set({ itemsPerPage: n, pageLayouts: {} }),

  setPageLayout: (pageIndex, shape) =>
    set((s) => ({ pageLayouts: { ...s.pageLayouts, [pageIndex]: shape } })),

  hydrateSettings: (s, bgImageUrl) => {
    applyColors(s.colors);
    applyFonts(s.fonts);
    applyFontSizes(s.fontSizes);
    loadStoredGoogleFonts(s.fonts as unknown as Record<string, string>);
    set({ ...s, bgImage: bgImageUrl });
  },

  resetSettings: () =>
    set((s) => {
      if (s.bgImage) URL.revokeObjectURL(s.bgImage);
      applyColors(DEFAULT_COLORS);
      applyFonts(DEFAULT_FONTS);
      applyFontSizes(DEFAULT_FONT_SIZES);
      dbClearAll();
      return { ...DEFAULT_STATE };
    }),
}));

export type { PersistedSettings };
