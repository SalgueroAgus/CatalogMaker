import { Badge as RadixBadge } from '@radix-ui/themes';

export function Badge({ children }: { children: React.ReactNode }) {
  return <RadixBadge size="2" radius="full">{children}</RadixBadge>;
}
