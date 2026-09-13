import { useState, type ReactElement } from 'react';
import { AlertDialog, Flex } from '@radix-ui/themes';
import { usePersistenceStore } from '../../store/usePersistenceStore';
import { Button } from '../atoms/Button';

interface Props {
  title: string;
  description: string;
  children: ReactElement;
  onConfirm: () => void | Promise<unknown>;
}

export function ConfirmAction({ title, description, children, onConfirm }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const busy = usePersistenceStore((s) => s.managing || s.exporting);
  return <AlertDialog.Root open={open} onOpenChange={(value) => { if (!pending) setOpen(value); }}>
    <AlertDialog.Trigger>{children}</AlertDialog.Trigger>
    <AlertDialog.Content className="editor-ui ui-dialog" maxWidth="440px">
      <AlertDialog.Title>{title}</AlertDialog.Title>
      <AlertDialog.Description size="3">{description}</AlertDialog.Description>
      <Flex gap="3" justify="end" mt="5" wrap="wrap">
        <AlertDialog.Cancel><Button disabled={pending}>Cancelar</Button></AlertDialog.Cancel>
        <Button variant="danger" disabled={busy || pending} onClick={async () => {
          setPending(true);
          try { await onConfirm(); setOpen(false); } finally { setPending(false); }
        }}>{pending ? 'Procesando…' : 'Confirmar'}</Button>
      </Flex>
    </AlertDialog.Content>
  </AlertDialog.Root>;
}
