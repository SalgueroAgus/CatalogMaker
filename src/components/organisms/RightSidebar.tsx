import * as Tabs from '@radix-ui/react-tabs';
import { useProductStore } from '../../store/useProductStore';
import { ArticulosTab } from './ArticulosTab';
import { PaginasTab } from './PaginasTab';

interface Props {
  visibleIds: Set<string>;
}

export function RightSidebar({ visibleIds }: Props) {
  const count = useProductStore((s) => s.products.length);

  return (
    <Tabs.Root defaultValue="articulos" asChild>
      <aside className="sidebar-right">
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
          <ArticulosTab visibleIds={visibleIds} />
        </Tabs.Content>
        <Tabs.Content value="paginas" className="rs-tab-panel">
          <PaginasTab />
        </Tabs.Content>
      </aside>
    </Tabs.Root>
  );
}
