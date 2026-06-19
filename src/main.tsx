import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

import './styles/globals.css';
import './styles/layout.css';
import './styles/sidebar-left.css';
import './styles/workspace.css';
import './styles/page.css';
import './styles/product.css';
import './styles/grid-1.css';
import './styles/grid-2.css';
import './styles/grid-3.css';
import './styles/grid-4.css';
import './styles/grid-5.css';
import './styles/index-page.css';
import './styles/sidebar-right.css';
import './styles/print.css';
import './styles/mobile.css';

import { useSettingsStore } from './store/useSettingsStore';
import { dbSaveSettings } from './db';

// Auto-save settings to IDB whenever they change (skips bgImage — blob lives separately)
useSettingsStore.subscribe((state) => {
  dbSaveSettings({
    storeName:      state.storeName,
    footerContact:  state.footerContact,
    colors:         state.colors,
    fonts:          state.fonts,
    fontSizes:      state.fontSizes,
    bgImageOpacity: state.bgImageOpacity,
    itemsPerPage:   state.itemsPerPage,
    pageLayouts:    state.pageLayouts,
  });
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
