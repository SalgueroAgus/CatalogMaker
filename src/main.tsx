import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import netlify from 'netlify-identity-widget';
import App from './App';

netlify.init();

import '@radix-ui/themes/styles.css';
import './styles/globals.css';
import './styles/layout.css';
import './styles/workspace.css';
import './styles/page.css';
import './styles/product.css';
import './styles/grid-1.css';
import './styles/grid-2.css';
import './styles/grid-3.css';
import './styles/grid-4.css';
import './styles/grid-5.css';
import './styles/index-page.css';
import './styles/print.css';
import './styles/editor.css';
import './styles/articles.css';
import './styles/mobile.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
