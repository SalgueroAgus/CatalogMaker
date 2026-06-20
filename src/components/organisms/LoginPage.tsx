interface Props {
  onLogin: () => void;
  loading?: boolean;
}

export function LoginPage({ onLogin, loading = false }: Props) {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">🎴</div>
        <h1 className="login-title">CatalogFlow Pro</h1>
        <p className="login-subtitle">Acceso por invitación</p>
        <button className="login-btn" onClick={onLogin} disabled={loading}>
          {loading ? 'Cargando…' : 'Iniciar sesión'}
        </button>
      </div>
    </div>
  );
}
