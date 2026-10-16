import { ArrowDown, ArrowUp } from 'lucide-react';
import { BotaoIcone } from '../botao-icone';

/**
 * ↑/↓ de uma linha: a alternativa direta ao arrastar.
 *
 * @param {{
 *   rotulo: string,
 *   indice: number,
 *   total: number,
 *   desabilitado: boolean,
 *   onMover: (de: number, para: number) => void,
 * }} props
 */
export function BotoesOrdem({ rotulo, indice, total, desabilitado, onMover }) {
  return (
    <>
      <BotaoIcone
        disabled={indice === 0 || desabilitado}
        icone={ArrowUp}
        onClick={() => onMover(indice, indice - 1)}
        rotulo={`Subir ${rotulo}`}
      />
      <BotaoIcone
        disabled={indice === total - 1 || desabilitado}
        icone={ArrowDown}
        onClick={() => onMover(indice, indice + 1)}
        rotulo={`Descer ${rotulo}`}
      />
    </>
  );
}
