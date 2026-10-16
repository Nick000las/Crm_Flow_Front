import { Checkbox } from '@/components/ui/checkbox';
import { ControleTravado } from '../controle-travado';

/**
 * Checkbox da matriz de campos. Travado, mostra o motivo (`ControleTravado`).
 *
 * @param {{
 *   id: string,
 *   rotulo: string,
 *   checked: boolean,
 *   motivo: string | null,
 *   ocupado: boolean,
 *   onChange: (marcado: boolean) => void,
 * }} props
 */
export function CheckboxDaMatriz({ id, rotulo, checked, motivo, ocupado, onChange }) {
  const motivoId = `${id}-motivo`;

  return (
    <ControleTravado motivo={motivo} motivoId={motivoId}>
      <Checkbox
        aria-describedby={motivo ? motivoId : undefined}
        aria-label={rotulo}
        checked={checked}
        className={motivo ? 'pointer-events-none' : undefined}
        disabled={Boolean(motivo) || ocupado}
        id={id}
        onCheckedChange={onChange}
      />
    </ControleTravado>
  );
}
