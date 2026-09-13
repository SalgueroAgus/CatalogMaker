import { Button } from '../atoms/Button';
import { EditorTheme } from '../atoms/EditorTheme';
import { Spinner } from '@radix-ui/themes';
import { BookOpen } from 'lucide-react';
import essaLogo from '../../assets/essa_logo.jpeg';

interface Props {
  onLogin: () => void;
  loading?: boolean;
}

export function LoginPage({ onLogin, loading = false }: Props) {
  return (
    <EditorTheme className="lp-root">
      <div className="lp-card">
        <div className="lp-logo-row">
          <img src={essaLogo} alt="ESSA Home" className="lp-logo" draggable={false} />
        </div>
        <div className="lp-title-row">
          <BookOpen size={24} />
          <span className="lp-title">CatalogMaker</span>
        </div>
        <div className="lp-body">
          {loading ? (
            <div role="status" aria-label="Cargando"><Spinner /></div>
          ) : (
            <>
              <p className="lp-copy">Acceso exclusivo para el equipo de ESSA Home.</p>
              <Button variant="export" className="lp-action-btn" onClick={onLogin}>
                Iniciar sesión
              </Button>
            </>
          )}
        </div>
      </div>
    </EditorTheme>
  );
}
