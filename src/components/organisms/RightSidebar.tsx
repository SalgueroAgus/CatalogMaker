import { SaveStatus } from '../molecules/SaveStatus';
import * as Tabs from '@radix-ui/react-tabs';
import { useProductStore } from '../../store/useProductStore';
import { ArticulosTab } from './ArticulosTab';
import { PaginasTab } from './PaginasTab';

interface Props {
  visibleIds: Set<string>;
  onClose: () => void;
  onShowProduct: (id: string) => void;
}

export function RightSidebar({ visibleIds, onClose, onShowProduct }: Props) {
  const count = useProductStore((s) => s.products.length);

  return (
    <Tabs.Root defaultValue="articulos" asChild>
      <aside className="sidebar-right" id="products-sidebar">
        <button className="drawer-close rs-action" data-drawer-close onClick={onClose}>Cerrar productos</button>
        <SaveStatus />
        <Tabs.List className="rs-tabs">
          <Tabs.Trigger value="articulos" className="rs-tab-btn">
            Artículos
            {count > 0 && <span className="rs-tab-badge">{count}</span>}
          </Tabs.Trigger>
          <Tabs.Trigger value="paginas" className="rs-tab-btn">
            Páginas
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="articulos" className="rs-tab-panel">
          <ArticulosTab visibleIds={visibleIds} onShowProduct={onShowProduct} />
        </Tabs.Content>
        <Tabs.Content value="paginas" className="rs-tab-panel">
          <PaginasTab />
        </Tabs.Content>
      </aside>
    </Tabs.Root>
  );
}
