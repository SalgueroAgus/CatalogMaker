import { useRef, useState, useEffect, useId, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import ColorPicker from 'react-best-gradient-color-picker';
import { useUIThemeStore } from '../../store/useUIThemeStore';

interface Props {
  value: string;
  onChange: (value: string) => void;
  solidOnly?: boolean;
  idSuffix?: string;
  label?: string;
  disabled?: boolean;
}

export const ColorPickerActivity = createContext(true);

const PICKER_W = 260;
const PICKER_H = 320;

export function GradientPickerPopover({ value, onChange, solidOnly, idSuffix, label = 'Fondo del producto', disabled = false }: Props) {
  const theme = useUIThemeStore((s) => s.theme);
  const active = useContext(ColorPickerActivity);
  const unavailable = disabled || !active;
  const dialogId = useId();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, maxHeight: 320 });

  function calcPos() {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const viewport = window.visualViewport;
    const minLeft = (viewport?.offsetLeft ?? 0) + 8;
    const minTop = (viewport?.offsetTop ?? 0) + 8;
    const vw = (viewport?.width ?? window.innerWidth) + minLeft - 8;
    const vh = (viewport?.height ?? window.innerHeight) + minTop - 8;
    const bottomClearance = window.innerWidth < 768 ? 80 : 8;
    const width = popRef.current?.offsetWidth ?? PICKER_W + 18;
    const maxHeight = Math.max(80, vh - minTop - bottomClearance - 8);
    const height = Math.min(popRef.current?.offsetHeight ?? PICKER_H, maxHeight);
    let top = r.bottom + 6;
    let left = r.left;
    if (left + width > vw - 8) left = vw - width - 8;
    if (left < minLeft) left = minLeft;
    if (top + height > vh - bottomClearance) top = r.top - height - 6;
    top = Math.max(minTop, Math.min(top, vh - bottomClearance - height));
    setPos({ top, left, maxHeight });
  }

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!open) calcPos();
    setOpen((o) => !o);
  }

  useEffect(() => {
    if (unavailable) {
      setOpen(false);
      return;
    }
    if (!open) return;
    closeRef.current?.focus();
    calcPos();
    const resize = new ResizeObserver(calcPos);
    if (popRef.current) resize.observe(popRef.current);
    const reposition = () => {
      if (!btnRef.current?.getClientRects().length) setOpen(false);
      else calcPos();
    };
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    window.visualViewport?.addEventListener('resize', reposition);
    window.visualViewport?.addEventListener('scroll', reposition);
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setOpen(false);
        btnRef.current?.focus();
      }
    }
    function labelInputs() {
      popRef.current?.querySelectorAll('input').forEach((input) => {
        const name = input.parentElement?.lastElementChild?.textContent;
        if (name && name.length < 30) input.setAttribute('aria-label', `${label}: ${name}`);
      });
    }
    labelInputs();
    const observer = new MutationObserver(labelInputs);
    if (popRef.current) observer.observe(popRef.current, { childList: true, subtree: true });
    popRef.current?.addEventListener('keydown', onKey);
    const popover = popRef.current;
    function onDown(e: MouseEvent | TouchEvent) {
      const target = e.target as Node;
      if (popRef.current?.contains(target) || btnRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown, { passive: true });
    return () => {
      observer.disconnect();
      resize.disconnect();
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
      window.visualViewport?.removeEventListener('resize', reposition);
      window.visualViewport?.removeEventListener('scroll', reposition);
      popover?.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [open, label, unavailable]);

  const expanded = open && !unavailable;

  return (
    <>
      <button
        ref={btnRef}
        className={`gpp-swatch${expanded ? ' gpp-swatch-open' : ''}`}
        onClick={handleClick}
        onMouseDown={(e) => e.stopPropagation()}
        style={{ background: value }}
        title="Editar color / degradado"
        aria-label={`Editar ${label}`}
        disabled={unavailable}
        aria-expanded={expanded}
        aria-controls={expanded ? dialogId : undefined}
        aria-haspopup="dialog"
      />
      {expanded && createPortal(
        <div
          ref={popRef}
          id={dialogId}
          role="dialog"
          aria-label={label}
          className="gpp-popover"
          style={pos}
        >
          <button className="rs-action" ref={closeRef} onClick={() => {
            setOpen(false);
            btnRef.current?.focus();
          }}>Listo</button>
          <ColorPicker
            value={value}
            onChange={onChange}
            hideColorTypeBtns={solidOnly}
            width={PICKER_W}
            height={200}
            idSuffix={idSuffix ?? ''}
            disableLightMode
            style={theme === 'dark' ? {
              body: { background: 'var(--ui-subtle)' },
              rbgcpInput: { color: 'var(--ui-text)', borderColor: 'var(--ui-border)' },
              rbgcpInputLabel: { color: 'var(--ui-muted)' },
              rbgcpControlInput: { color: 'var(--ui-text)' },
              rbgcpControlBtn: { color: 'var(--ui-text)' },
              rbgcpControlBtnWrapper: { background: 'var(--ui-hover)' },
              rbgcpControlBtnSelected: { color: 'var(--ui-accent)', background: 'var(--ui-accent-soft)' },
              rbgcpControlIcon: { stroke: 'var(--ui-text)' },
              rbgcpControlIcon2: { fill: 'var(--ui-text)' },
              rbgcpColorModelDropdown: { background: 'var(--ui-hover)', border: '1px solid var(--ui-border)' },
              rbgcpComparibleLabel: { color: 'var(--ui-muted)' },
            } : undefined}
          />
        </div>,
        document.body
      )}
    </>
  );
}
