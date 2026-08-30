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
    classes: 'border-warning/40 bg-warning/10 text-warning',
  },
  [NIVEIS_ALERTA.INFO]: {
    icone: Info,
    classes: 'border-info/40 bg-info/10 text-info',
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
        'rounded-lg border',
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
        'inline-flex w-fit items-center gap-1 rounded-md border px-1.5 text-[11px] font-medium',
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
