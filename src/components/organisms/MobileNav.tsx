type Tab = 'preview' | 'settings' | 'products';

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'preview',  icon: '👁',  label: 'Vista Previa' },
  { id: 'settings', icon: '⚙️', label: 'Ajustes' },
  { id: 'products', icon: '📋', label: 'Productos' },
];

export function MobileNav({ activeTab, onTabChange }: Props) {
  return (
    <nav className="mobile-nav" aria-label="Navegación principal">
      <div className="mobile-nav-inner">
        {TABS.map(({ id, icon, label }) => (
          <button
            key={id}
            className={`mnav-tab ${activeTab === id ? 'active' : ''}`}
            data-tab={id}
            onClick={() => onTabChange(id)}
            aria-label={label}
          >
            <span className="mnav-icon">{icon}</span>
            <span className="mnav-label">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
