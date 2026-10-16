import { GripVertical } from 'lucide-react';

/**
 * Alça de arrastar de uma linha. Recebe as props de `useLinhaOrdenavel().puxador`.
 *
 * @param {{ rotulo: string } & Record<string, unknown>} props
 */
export function PuxadorOrdem({ rotulo, ...puxador }) {
  return (
    <button
      {...puxador}
      aria-label={`Reordenar ${rotulo}`}
      className="flex size-7 cursor-grab items-center justify-center text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
      type="button"
    >
      <GripVertical aria-hidden="true" className="size-4" />
    </button>
  );
}
