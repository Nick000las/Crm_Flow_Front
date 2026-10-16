import { Button } from '@/components/ui/button';

/**
 * Botão só com ícone: o rótulo vira `aria-label` e `title` (CLAUDE.md —
 * todo ícone sem texto tem nome acessível).
 *
 * @param {{ rotulo: string, icone: import('lucide-react').LucideIcon } & Record<string, unknown>} props
 */
export function BotaoIcone({ rotulo, icone: Icone, ...props }) {
  return (
    <Button aria-label={rotulo} className="rounded-none" size="icon-sm" title={rotulo} variant="ghost" {...props}>
      <Icone aria-hidden="true" />
    </Button>
  );
}
