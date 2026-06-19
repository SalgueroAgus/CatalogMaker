import type { GridShape } from '../../types';

interface Props {
  count: number;
  value: GridShape;
  onChange: (shape: GridShape) => void;
}

interface ShapeOption {
  shape: GridShape;
  label: string;
  icon: React.ReactNode;
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 44 32" width="44" height="32" aria-hidden>
      {children}
    </svg>
  );
}

const R = 2; // corner radius for rects

const SHAPES: Record<number, ShapeOption[]> = {
  1: [
    { shape: 'single', label: 'Completo', icon: (
      <Icon><rect x="0" y="0" width="44" height="32" rx={R} /></Icon>
    )},
  ],
  2: [
    { shape: 'duo-cols', label: 'Lado a lado', icon: (
      <Icon>
        <rect x="0"  y="0" width="21" height="32" rx={R} />
        <rect x="23" y="0" width="21" height="32" rx={R} />
      </Icon>
    )},
    { shape: 'duo-rows', label: 'Apilado', icon: (
      <Icon>
        <rect x="0" y="0"  width="44" height="15" rx={R} />
        <rect x="0" y="17" width="44" height="15" rx={R} />
      </Icon>
    )},
    { shape: 'duo-left-big', label: 'Izquierda grande', icon: (
      <Icon>
        <rect x="0"  y="0" width="27" height="32" rx={R} />
        <rect x="29" y="0" width="15" height="32" rx={R} />
      </Icon>
    )},
    { shape: 'duo-right-big', label: 'Derecha grande', icon: (
      <Icon>
        <rect x="0"  y="0" width="15" height="32" rx={R} />
        <rect x="17" y="0" width="27" height="32" rx={R} />
      </Icon>
    )},
  ],
  3: [
    { shape: 'trio-cols', label: '3 columnas', icon: (
      <Icon>
        <rect x="0"  y="0" width="13" height="32" rx={R} />
        <rect x="15" y="0" width="14" height="32" rx={R} />
        <rect x="31" y="0" width="13" height="32" rx={R} />
      </Icon>
    )},
    { shape: 'trio-rows', label: '3 filas', icon: (
      <Icon>
        <rect x="0" y="0"  width="44" height="9"  rx={R} />
        <rect x="0" y="11" width="44" height="10" rx={R} />
        <rect x="0" y="23" width="44" height="9"  rx={R} />
      </Icon>
    )},
    { shape: 'trio-left', label: 'Grande izquierda', icon: (
      <Icon>
        <rect x="0"  y="0"  width="26" height="32" rx={R} />
        <rect x="28" y="0"  width="16" height="15" rx={R} />
        <rect x="28" y="17" width="16" height="15" rx={R} />
      </Icon>
    )},
    { shape: 'trio-right', label: 'Grande derecha', icon: (
      <Icon>
        <rect x="0"  y="0"  width="16" height="15" rx={R} />
        <rect x="0"  y="17" width="16" height="15" rx={R} />
        <rect x="18" y="0"  width="26" height="32" rx={R} />
      </Icon>
    )},
    { shape: 'trio-top', label: 'Grande arriba', icon: (
      <Icon>
        <rect x="0"  y="0"  width="44" height="15" rx={R} />
        <rect x="0"  y="17" width="21" height="15" rx={R} />
        <rect x="23" y="17" width="21" height="15" rx={R} />
      </Icon>
    )},
    { shape: 'trio-bottom', label: 'Grande abajo', icon: (
      <Icon>
        <rect x="0"  y="0"  width="21" height="15" rx={R} />
        <rect x="23" y="0"  width="21" height="15" rx={R} />
        <rect x="0"  y="17" width="44" height="15" rx={R} />
      </Icon>
    )},
  ],
  4: [
    { shape: 'quad-grid', label: '2×2', icon: (
      <Icon>
        <rect x="0"  y="0"  width="21" height="14" rx={R} />
        <rect x="23" y="0"  width="21" height="14" rx={R} />
        <rect x="0"  y="17" width="21" height="15" rx={R} />
        <rect x="23" y="17" width="21" height="15" rx={R} />
      </Icon>
    )},
    { shape: 'quad-left', label: 'Grande izquierda', icon: (
      <Icon>
        <rect x="0"  y="0"  width="21" height="32" rx={R} />
        <rect x="23" y="0"  width="21" height="9"  rx={R} />
        <rect x="23" y="11" width="21" height="10" rx={R} />
        <rect x="23" y="23" width="21" height="9"  rx={R} />
      </Icon>
    )},
    { shape: 'quad-right', label: 'Grande derecha', icon: (
      <Icon>
        <rect x="0"  y="0"  width="21" height="9"  rx={R} />
        <rect x="0"  y="11" width="21" height="10" rx={R} />
        <rect x="0"  y="23" width="21" height="9"  rx={R} />
        <rect x="23" y="0"  width="21" height="32" rx={R} />
      </Icon>
    )},
    { shape: 'quad-top', label: 'Grande arriba', icon: (
      <Icon>
        <rect x="0"  y="0"  width="44" height="14" rx={R} />
        <rect x="0"  y="17" width="13" height="15" rx={R} />
        <rect x="15" y="17" width="14" height="15" rx={R} />
        <rect x="31" y="17" width="13" height="15" rx={R} />
      </Icon>
    )},
    { shape: 'quad-bottom', label: 'Grande abajo', icon: (
      <Icon>
        <rect x="0"  y="0"  width="13" height="14" rx={R} />
        <rect x="15" y="0"  width="14" height="14" rx={R} />
        <rect x="31" y="0"  width="13" height="14" rx={R} />
        <rect x="0"  y="17" width="44" height="15" rx={R} />
      </Icon>
    )},
  ],
  5: [
    { shape: 'quint-2-3', label: '2 arriba · 3 abajo', icon: (
      <Icon>
        <rect x="0"  y="0"  width="21" height="14" rx={R} />
        <rect x="23" y="0"  width="21" height="14" rx={R} />
        <rect x="0"  y="17" width="13" height="15" rx={R} />
        <rect x="15" y="17" width="14" height="15" rx={R} />
        <rect x="31" y="17" width="13" height="15" rx={R} />
      </Icon>
    )},
    { shape: 'quint-3-2', label: '3 arriba · 2 abajo', icon: (
      <Icon>
        <rect x="0"  y="0"  width="13" height="14" rx={R} />
        <rect x="15" y="0"  width="14" height="14" rx={R} />
        <rect x="31" y="0"  width="13" height="14" rx={R} />
        <rect x="0"  y="17" width="21" height="15" rx={R} />
        <rect x="23" y="17" width="21" height="15" rx={R} />
      </Icon>
    )},
    { shape: 'quint-top', label: 'Grande arriba', icon: (
      <Icon>
        <rect x="0"  y="0"  width="44" height="9"  rx={R} />
        <rect x="0"  y="11" width="21" height="9"  rx={R} />
        <rect x="23" y="11" width="21" height="9"  rx={R} />
        <rect x="0"  y="22" width="21" height="10" rx={R} />
        <rect x="23" y="22" width="21" height="10" rx={R} />
      </Icon>
    )},
    { shape: 'quint-bottom', label: 'Grande abajo', icon: (
      <Icon>
        <rect x="0"  y="0"  width="21" height="9"  rx={R} />
        <rect x="23" y="0"  width="21" height="9"  rx={R} />
        <rect x="0"  y="11" width="21" height="9"  rx={R} />
        <rect x="23" y="11" width="21" height="9"  rx={R} />
        <rect x="0"  y="22" width="44" height="10" rx={R} />
      </Icon>
    )},
    { shape: 'quint-left', label: 'Grande izquierda', icon: (
      <Icon>
        <rect x="0"  y="0"  width="13" height="32" rx={R} />
        <rect x="15" y="0"  width="13" height="14" rx={R} />
        <rect x="30" y="0"  width="14" height="14" rx={R} />
        <rect x="15" y="17" width="13" height="15" rx={R} />
        <rect x="30" y="17" width="14" height="15" rx={R} />
      </Icon>
    )},
  ],
};

export function GridShapePicker({ count, value, onChange }: Props) {
  const options = SHAPES[count] ?? [];

  return (
    <div className="gsp-grid">
      {options.map(({ shape, label, icon }) => (
        <button
          key={shape}
          className={`gsp-btn ${value === shape ? 'active' : ''}`}
          title={label}
          onClick={() => onChange(shape)}
        >
          {icon}
          <span className="gsp-label">{label}</span>
        </button>
      ))}
    </div>
  );
}
