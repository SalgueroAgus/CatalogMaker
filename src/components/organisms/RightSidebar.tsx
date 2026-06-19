import { useState } from 'react';
import { useProductStore } from '../../store/useProductStore';
import { ArticulosTab } from './ArticulosTab';
import { PaginasTab } from './PaginasTab';

interface Props {
  visibleIds: Set<string>;
}

type Tab = 'articulos' | 'paginas';

export function RightSidebar({ visibleIds }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('articulos');
  const count = useProductStore((s) => s.products.length);

  return (
    <aside className="sidebar-right">
      <div className="rs-tabs">
        <button
          className={`rs-tab-btn ${activeTab === 'articulos' ? 'active' : ''}`}
          onClick={() => setActiveTab('articulos')}
        >
          Artículos
          {count > 0 && <span className="rs-tab-badge">{count}</span>}
        </button>
        <button
          className={`rs-tab-btn ${activeTab === 'paginas' ? 'active' : ''}`}
          onClick={() => setActiveTab('paginas')}
        >
          Páginas
        </button>
      </div>

      {activeTab === 'articulos' && <ArticulosTab visibleIds={visibleIds} />}
      {activeTab === 'paginas' && <PaginasTab />}
    </aside>
  );
}
