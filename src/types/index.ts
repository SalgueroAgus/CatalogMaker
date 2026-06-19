export interface Product {
  id: string;
  name: string;
  price: string;
  description: string;
  image: string;
  bgColor: string;
}

export interface Colors {
  bg: string;
  primary: string;
  secondary: string;
  text: string;
}

export interface Fonts {
  company: string;
  heading: string;
  price: string;
  body: string;
  small: string;
  pageNum: string;
  idxTitle: string;
  idxSubtitle: string;
  idxEntry: string;
  idxNum: string;
}

export interface FontSizes {
  company: number;
  heading: number;
  price: number;
  body: number;
  small: number;
  pageNum: number;
  idxTitle: number;
  idxSubtitle: number;
  idxEntry: number;
  idxNum: number;
}

export type GridShape =
  | 'single'
  | 'duo-cols' | 'duo-rows' | 'duo-left-big' | 'duo-right-big'
  | 'trio-cols' | 'trio-rows' | 'trio-left' | 'trio-right' | 'trio-top' | 'trio-bottom'
  | 'quad-grid' | 'quad-left' | 'quad-right' | 'quad-top' | 'quad-bottom'
  | 'quint-2-3' | 'quint-3-2' | 'quint-top' | 'quint-bottom' | 'quint-left';

export const DEFAULT_GRID_SHAPE: Record<number, GridShape> = {
  1: 'single',
  2: 'duo-cols',
  3: 'trio-left',
  4: 'quad-grid',
  5: 'quint-2-3',
};

export const SHAPE_ITEM_COUNT: Record<GridShape, number> = {
  single: 1,
  'duo-cols': 2, 'duo-rows': 2, 'duo-left-big': 2, 'duo-right-big': 2,
  'trio-cols': 3, 'trio-rows': 3, 'trio-left': 3, 'trio-right': 3, 'trio-top': 3, 'trio-bottom': 3,
  'quad-grid': 4, 'quad-left': 4, 'quad-right': 4, 'quad-top': 4, 'quad-bottom': 4,
  'quint-2-3': 5, 'quint-3-2': 5, 'quint-top': 5, 'quint-bottom': 5, 'quint-left': 5,
};
