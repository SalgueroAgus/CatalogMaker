export const SYSTEM_FONTS = [
  { name: 'Arial',           stack: 'Arial, Helvetica, sans-serif' },
  { name: 'Helvetica Neue',  stack: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
  { name: 'Verdana',         stack: 'Verdana, Geneva, sans-serif' },
  { name: 'Tahoma',          stack: 'Tahoma, Geneva, sans-serif' },
  { name: 'Trebuchet MS',    stack: '"Trebuchet MS", Helvetica, sans-serif' },
  { name: 'Georgia',         stack: 'Georgia, "Times New Roman", serif' },
  { name: 'Times New Roman', stack: '"Times New Roman", Times, serif' },
  { name: 'Palatino',        stack: '"Palatino Linotype", "Book Antiqua", Palatino, serif' },
  { name: 'Garamond',        stack: 'Garamond, "Times New Roman", serif' },
  { name: 'Courier New',     stack: '"Courier New", Courier, monospace' },
  { name: 'Lucida Sans',     stack: '"Lucida Sans Unicode", "Lucida Grande", sans-serif' },
  { name: 'Futura',          stack: 'Futura, "Trebuchet MS", sans-serif' },
  { name: 'System UI',       stack: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' },
] as const;

interface GoogleFont {
  name: string;
  family: string;
  stack: string;
}

export const GOOGLE_FONTS: readonly GoogleFont[] = [
  // Sans-serifs
  { name: 'Inter',              family: 'Inter',              stack: "'Inter', sans-serif" },
  { name: 'Montserrat',         family: 'Montserrat',         stack: "'Montserrat', sans-serif" },
  { name: 'Poppins',            family: 'Poppins',            stack: "'Poppins', sans-serif" },
  { name: 'Raleway',            family: 'Raleway',            stack: "'Raleway', sans-serif" },
  { name: 'Nunito',             family: 'Nunito',             stack: "'Nunito', sans-serif" },
  { name: 'Nunito Sans',        family: 'Nunito Sans',        stack: "'Nunito Sans', sans-serif" },
  { name: 'Lato',               family: 'Lato',               stack: "'Lato', sans-serif" },
  { name: 'Open Sans',          family: 'Open Sans',          stack: "'Open Sans', sans-serif" },
  { name: 'DM Sans',            family: 'DM Sans',            stack: "'DM Sans', sans-serif" },
  { name: 'Plus Jakarta Sans',  family: 'Plus Jakarta Sans',  stack: "'Plus Jakarta Sans', sans-serif" },
  { name: 'Outfit',             family: 'Outfit',             stack: "'Outfit', sans-serif" },
  { name: 'Work Sans',          family: 'Work Sans',          stack: "'Work Sans', sans-serif" },
  { name: 'Jost',               family: 'Jost',               stack: "'Jost', sans-serif" },
  { name: 'Mulish',             family: 'Mulish',             stack: "'Mulish', sans-serif" },
  { name: 'Manrope',            family: 'Manrope',            stack: "'Manrope', sans-serif" },
  { name: 'Karla',              family: 'Karla',              stack: "'Karla', sans-serif" },
  { name: 'Rubik',              family: 'Rubik',              stack: "'Rubik', sans-serif" },
  { name: 'Source Sans 3',      family: 'Source Sans 3',      stack: "'Source Sans 3', sans-serif" },
  { name: 'Barlow',             family: 'Barlow',             stack: "'Barlow', sans-serif" },
  // Display serifs
  { name: 'Playfair Display',   family: 'Playfair Display',   stack: "'Playfair Display', serif" },
  { name: 'Cormorant Garamond', family: 'Cormorant Garamond', stack: "'Cormorant Garamond', serif" },
  { name: 'Libre Baskerville',  family: 'Libre Baskerville',  stack: "'Libre Baskerville', serif" },
  { name: 'Lora',               family: 'Lora',               stack: "'Lora', serif" },
  { name: 'Merriweather',       family: 'Merriweather',       stack: "'Merriweather', serif" },
  { name: 'EB Garamond',        family: 'EB Garamond',        stack: "'EB Garamond', serif" },
  { name: 'Crimson Text',       family: 'Crimson Text',       stack: "'Crimson Text', serif" },
  { name: 'DM Serif Display',   family: 'DM Serif Display',   stack: "'DM Serif Display', serif" },
  // Bold display
  { name: 'Bebas Neue',         family: 'Bebas Neue',         stack: "'Bebas Neue', sans-serif" },
  { name: 'Oswald',             family: 'Oswald',             stack: "'Oswald', sans-serif" },
  { name: 'Fjalla One',         family: 'Fjalla One',         stack: "'Fjalla One', sans-serif" },
  { name: 'Righteous',          family: 'Righteous',          stack: "'Righteous', sans-serif" },
  { name: 'Anton',              family: 'Anton',              stack: "'Anton', sans-serif" },
  { name: 'Abril Fatface',      family: 'Abril Fatface',      stack: "'Abril Fatface', serif" },
  // Scripts
  { name: 'Pacifico',           family: 'Pacifico',           stack: "'Pacifico', cursive" },
  { name: 'Dancing Script',     family: 'Dancing Script',     stack: "'Dancing Script', cursive" },
  { name: 'Great Vibes',        family: 'Great Vibes',        stack: "'Great Vibes', cursive" },
  { name: 'Sacramento',         family: 'Sacramento',         stack: "'Sacramento', cursive" },
  // Monospace
  { name: 'Space Mono',         family: 'Space Mono',         stack: "'Space Mono', monospace" },
  { name: 'DM Mono',            family: 'DM Mono',            stack: "'DM Mono', monospace" },
];

const loadedFonts = new Set<string>();

export function loadGoogleFont(family: string): void {
  if (loadedFonts.has(family)) return;
  loadedFonts.add(family);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

const googleFamilySet = new Set(GOOGLE_FONTS.map((f) => f.family));

export function loadStoredGoogleFonts(fonts: Record<string, string>): void {
  Object.values(fonts).forEach((stack) => {
    const family = stack.split(',')[0].trim().replace(/['"]/g, '');
    if (googleFamilySet.has(family)) loadGoogleFont(family);
  });
}
