import { useRef, useState, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import ColorPicker from 'react-best-gradient-color-picker';

interface Props {
  value: string;
  onChange: (value: string) => void;
  solidOnly?: boolean;
  idSuffix?: string;
  label?: string;
  disabled?: boolean;
}

const PICKER_W = 260;
const PICKER_H = 320;

export function GradientPickerPopover({ value, onChange, solidOnly, idSuffix, label = 'Fondo del producto', disabled = false }: Props) {
  const dialogId = useId();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  function calcPos() {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const vw = window.visualViewport?.width ?? window.innerWidth;
    const vh = window.visualViewport?.height ?? window.innerHeight;
    // leave 70px clearance at bottom so the picker clears the mobile nav bar
    const bottomClearance = 70;
    let top = r.bottom + 6;
    let left = r.left;
    if (left + PICKER_W > vw - 8) left = vw - PICKER_W - 8;
    if (left < 8) left = 8;
    if (top + PICKER_H > vh - bottomClearance) top = r.top - PICKER_H - 6;
    if (top < 8) top = 8;
    setPos({ top, left });
  }

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!open) calcPos();
    setOpen((o) => !o);
  }

  useEffect(() => {
    if (disabled) {
      setOpen(false);
      return;
    }
    if (!open) return;
    closeRef.current?.focus();
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
      popover?.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [open, label, disabled]);

  const expanded = open && !disabled;

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
        disabled={disabled}
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
          style={{ top: pos.top, left: pos.left }}
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
          />
        </div>,
        document.body
      )}
    </>
  );
}
