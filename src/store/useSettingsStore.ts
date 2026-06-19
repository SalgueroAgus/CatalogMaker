import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Colors, Fonts, FontSizes, GridShape } from '../types';
import { loadStoredGoogleFonts } from '../constants/fonts';

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

function applyColors(colors: Colors) {
  (Object.entries(colors) as [keyof Colors, string][]).forEach(([k, v]) => {
    setCSSVar(COLOR_VAR_MAP[k], v);
  });
}

function applyFonts(fonts: Fonts) {
  (Object.entries(fonts) as [keyof Fonts, string][]).forEach(([k, v]) => {
    setCSSVar(FONT_VAR_MAP[k], v);
  });
}

function applyFontSizes(fontSizes: FontSizes) {
  (Object.entries(fontSizes) as [keyof FontSizes, number][]).forEach(([k, v]) => {
    setCSSVar(SIZE_VAR_MAP[k], `${v}px`);
  });
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
}

const DEFAULT_FONTS: Fonts = {
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

const DEFAULT_FONT_SIZES: FontSizes = {
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

const DEFAULT_COLORS: Colors = {
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

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      storeName: 'CATÁLOGO HOGAR & DECO',
      footerContact: 'Contacto: ventas@tutienda.com | WhatsApp: +54 9 11 2345-6789',
      colors: DEFAULT_COLORS,
      fonts: DEFAULT_FONTS,
      fontSizes: DEFAULT_FONT_SIZES,
      bgImage: null,
      bgImageOpacity: 0.15,
      itemsPerPage: 3,
      pageLayouts: {},

      updateStoreName: (v) => set({ storeName: v.toUpperCase() }),
      updateContact: (v) => set({ footerContact: v }),

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
          return { bgImage: file ? URL.createObjectURL(file) : null };
        }),

      setBgImageOpacity: (v) => set({ bgImageOpacity: v }),
      setItemsPerPage: (n) => set({ itemsPerPage: n, pageLayouts: {} }),
      setPageLayout: (pageIndex, shape) =>
        set((s) => ({ pageLayouts: { ...s.pageLayouts, [pageIndex]: shape } })),
    }),
    {
      name: 'catalogmaker-settings',
      version: 5,
      migrate: (state: any, version) => {
        if (version === 0 && state?.colors) {
          state = {
            ...state,
            colors: {
              bg:        hexToRgba(state.colors.bg        ?? '#fafafa'),
              primary:   hexToRgba(state.colors.primary   ?? '#4f5e4f'),
              secondary: hexToRgba(state.colors.secondary ?? '#d9c3b0'),
              text:      hexToRgba(state.colors.text      ?? '#374151'),
            },
          };
        }
        if (version <= 1) {
          state = {
            ...state,
            fonts: { ...state.fonts, company: state.fonts?.small ?? 'Arial, Helvetica, sans-serif' },
            fontSizes: { ...DEFAULT_FONT_SIZES },
          };
        }
        if (version <= 2) {
          state = {
            ...state,
            fonts: { ...state.fonts, price: state.fonts?.heading ?? 'Arial, Helvetica, sans-serif' },
            fontSizes: {
              ...DEFAULT_FONT_SIZES,
              ...(state.fontSizes ?? {}),
              price: state.fontSizes?.price ?? 12,
              idxTitle: state.fontSizes?.idxTitle ?? 26,
              idxSubtitle: state.fontSizes?.idxSubtitle ?? 11,
              idxEntry: state.fontSizes?.idxEntry ?? 11,
              idxNum: state.fontSizes?.idxNum ?? 10,
            },
          };
        }
        if (version <= 3) {
          const f = state.fonts ?? {};
          const fs = state.fontSizes ?? {};
          state = {
            ...state,
            fonts: {
              ...f,
              pageNum:     f.pageNum     ?? f.small   ?? 'Arial, Helvetica, sans-serif',
              idxTitle:    f.idxTitle    ?? f.heading ?? 'Arial, Helvetica, sans-serif',
              idxSubtitle: f.idxSubtitle ?? f.small   ?? 'Arial, Helvetica, sans-serif',
              idxEntry:    f.idxEntry    ?? f.body    ?? 'Arial, Helvetica, sans-serif',
              idxNum:      f.idxNum      ?? f.small   ?? 'Arial, Helvetica, sans-serif',
            },
            fontSizes: {
              ...DEFAULT_FONT_SIZES,
              ...fs,
              pageNum:     fs.pageNum     ?? fs.small ?? 9,
              idxTitle:    fs.idxTitle    ?? 26,
              idxSubtitle: fs.idxSubtitle ?? 11,
              idxEntry:    fs.idxEntry    ?? 11,
              idxNum:      fs.idxNum      ?? 10,
            },
          };
        }
        if (version <= 4) {
          const old = state.colors ?? {};
          const primary   = old.primary   ?? DEFAULT_COLORS.name;
          const secondary = old.secondary ?? DEFAULT_COLORS.divider;
          const text      = old.text      ?? DEFAULT_COLORS.desc;
          state = {
            ...state,
            colors: {
              bg:        old.bg ?? DEFAULT_COLORS.bg,
              company:   DEFAULT_COLORS.company,
              pageNum:   DEFAULT_COLORS.pageNum,
              divider:   secondary,
              footer:    DEFAULT_COLORS.footer,
              name:      primary,
              price:     DEFAULT_COLORS.price,
              desc:      text,
              idxTitle:  primary,
              idxText:   text,
              idxAccent: primary,
            },
          };
        }
        return state;
      },
      partialize: (s) => ({
        storeName:      s.storeName,
        footerContact:  s.footerContact,
        colors:         s.colors,
        fonts:          s.fonts,
        fontSizes:      s.fontSizes,
        bgImageOpacity: s.bgImageOpacity,
        itemsPerPage:   s.itemsPerPage,
        pageLayouts:    s.pageLayouts,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        applyColors(state.colors);
        applyFonts(state.fonts);
        applyFontSizes(state.fontSizes);
        loadStoredGoogleFonts(state.fonts as unknown as Record<string, string>);
      },
    }
  )
);
