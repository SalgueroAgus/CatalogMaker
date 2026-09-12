import { usePersistenceStore } from '../../store/usePersistenceStore';

interface Props {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
  nav: React.ReactNode;
}

export function AppLayout({ left, center, right, nav }: Props) {
  const busy = usePersistenceStore((s) => s.managing || s.exporting);
  return (
    <>
      <fieldset className="app-layout" disabled={busy} aria-label="Editor de catálogo" aria-busy={busy}>
        {left}
        {center}
        {right}
      </fieldset>
      {nav}
    </>
  );
}
