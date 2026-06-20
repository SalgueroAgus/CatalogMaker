import { BookOpen } from 'lucide-react';
import essaLogo from '../../assets/essa_logo.jpeg';

interface Props {
  onLogin: () => void;
  loading?: boolean;
}

export function LoginPage({ onLogin, loading = false }: Props) {
  return (
    <div className="lp-root">
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
            <div className="lp-dots">
              <span /><span /><span />
            </div>
          ) : (
            <>
              <p className="lp-copy">Acceso exclusivo para el equipo de ESSA Home.</p>
              <button className="lp-action-btn" onClick={onLogin}>
                Iniciar sesión
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
