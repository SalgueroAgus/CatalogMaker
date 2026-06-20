import { Eye, LayoutList, Settings, type LucideIcon } from 'lucide-react';

type Tab = 'preview' | 'settings' | 'products';

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TABS: { id: Tab; Icon: LucideIcon; label: string }[] = [
  { id: 'preview',  Icon: Eye,        label: 'Vista Previa' },
  { id: 'settings', Icon: Settings,   label: 'Ajustes' },
  { id: 'products', Icon: LayoutList, label: 'Productos' },
];

export function MobileNav({ activeTab, onTabChange }: Props) {
  return (
    <nav className="mobile-nav" aria-label="Navegación principal">
      <div className="mobile-nav-inner">
        {TABS.map(({ id, Icon, label }) => (
          <button
            key={id}
            className={`mnav-tab ${activeTab === id ? 'active' : ''}`}
            data-tab={id}
            onClick={() => onTabChange(id)}
            aria-label={label}
          >
            <span className="mnav-icon"><Icon size={20} /></span>
            <span className="mnav-label">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
