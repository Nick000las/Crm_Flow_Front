import { AlertTriangle, Info, OctagonAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NIVEIS_ALERTA, rotuloDoNivel } from '../lib/alertas-formulario';

/** Crítico em vermelho, atenção em amarelo, informativo em azul (handoff FM5). */
const ESTILO_DO_NIVEL = Object.freeze({
  [NIVEIS_ALERTA.CRITICO]: {
    icone: OctagonAlert,
    classes: 'border-destructive/50 bg-destructive/10 text-destructive',
  },
  [NIVEIS_ALERTA.ATENCAO]: {
    icone: AlertTriangle,
    classes: 'border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-300',
  },
  [NIVEIS_ALERTA.INFO]: {
    icone: Info,
    classes: 'border-blue-500/50 bg-blue-500/10 text-blue-800 dark:text-blue-300',
  },
});

const estiloDe = (nivel) => ESTILO_DO_NIVEL[nivel] ?? ESTILO_DO_NIVEL[NIVEIS_ALERTA.INFO];

/**
 * Item de lista com as cores do nível (o alerta na ficha). `apagado`: já visto.
 *
 * @param {{ nivel: string, apagado?: boolean, className?: string, children: import('react').ReactNode }} props
 */
export function CaixaDoNivel({ nivel, apagado = false, className, children }) {
  return (
    <li
      className={cn(
        'border',
        apagado ? 'border-border text-muted-foreground' : estiloDe(nivel).classes,
        className,
      )}
    >
      {children}
    </li>
  );
}

/**
 * O nível de um alerta de formulário (FM5), com ícone, cor e rótulo. A cor
 * nunca vem sozinha: o rótulo está sempre no texto (ou no `aria-label`).
 *
 * @param {{ nivel: string, prefixo?: string, className?: string }} props
 *   `prefixo`: texto antes do rótulo, ex. "Alerta do formulário" no card
 */
export function SeloAlerta({ nivel, prefixo, className }) {
  const { icone: Icone, classes } = estiloDe(nivel);
  const rotulo = rotuloDoNivel(nivel);

  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1 border px-1.5 text-[11px] font-medium',
        classes,
        className,
      )}
    >
      <Icone aria-hidden="true" className="size-3" />
      {prefixo && <span className="sr-only">{prefixo}: </span>}
      {rotulo}
    </span>
  );
}
