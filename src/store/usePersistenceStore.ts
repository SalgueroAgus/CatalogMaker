import { create } from 'zustand';

export type MutationResult =
  | { status: 'saved' | 'ignored' }
  | { status: 'failed' | 'invalid'; error: string };

interface PersistenceState {
  loading: 'loading' | 'ready' | 'failed';
  saving: 'saved' | 'saving' | 'failed';
  error: string | null;
  revision: number;
  savedRevision: number;
  managing: boolean;
  exporting: boolean;
}

export const usePersistenceStore = create<PersistenceState>(() => ({
  loading: 'loading',
  saving: 'saved',
  error: null,
  revision: 0,
  savedRevision: 0,
  managing: false,
  exporting: false,
}));
