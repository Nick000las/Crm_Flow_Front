import { Plus, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { condicaoDoCampo } from '../lib/regras';
import { BotaoIcone } from './botao-icone';
import { CondicaoDeCampo } from './condicao-de-campo';

/**
 * As condições de uma regra (distribuição, pontuação): uma
 * `CondicaoDeCampo` por linha, remover e "Adicionar condição" até `maximo`.
 * Todas precisam valer; sem nenhuma, a regra vale para todos os leads.
 * Montado junto do form da regra: adicionar e remover passam por aqui, que
 * guarda uma chave estável por linha (remover uma do meio não troca o
 * estado das outras).
 *
 * @param {{
 *   idBase: string,
 *   condicoes: import('../lib/condicoes').CondicaoNoForm[],
 *   campos: import('../types').Campo[],
 *   maximo: number,
 *   erroDe: (caminho: string) => string | null,
 *   onChange: (condicoes: import('../lib/condicoes').CondicaoNoForm[]) => void,
 *   legenda?: string,
 * }} props `erroDe`: `condicoes` e `condicoes.<i>` (o caminho do 400 sem `regras.<n>.`)
 */
export function ListaCondicoes({
  idBase,
  condicoes,
  campos,
  maximo,
  erroDe,
  onChange,
  legenda = 'Quando o lead',
}) {
  const proximaChave = useRef(condicoes.length);
  const [chaves, setChaves] = useState(() => condicoes.map((_, indice) => indice));
  const cheia = condicoes.length >= maximo;

  function alterar(indice, condicao) {
    onChange(condicoes.map((atual, posicao) => (posicao === indice ? condicao : atual)));
  }

  function adicionar() {
    setChaves((atuais) => [...atuais, proximaChave.current++]);
    onChange([...condicoes, condicaoDoCampo(undefined)]);
  }

  function remover(indice) {
    setChaves((atuais) => atuais.filter((_, posicao) => posicao !== indice));
    onChange(condicoes.filter((_, posicao) => posicao !== indice));
  }

  return (
    <fieldset className="grid gap-3">
      <legend className="mb-1 text-sm font-medium">{legenda}</legend>
      <p className="-mt-1 text-xs text-muted-foreground">
        Todas as condições precisam valer. Sem condição, a regra vale para todos os leads.
      </p>
      {erroDe('condicoes') && <p className="text-xs text-destructive">{erroDe('condicoes')}</p>}

      {condicoes.map((condicao, indice) => {
        const erro = erroDe(`condicoes.${indice}`);
        const temCampo = campos.some((campo) => campo.id === condicao.campoId);

        return (
          <div className="grid gap-3 border border-border p-3" key={chaves[indice]}>
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
                Condição {indice + 1}
              </p>
              <BotaoIcone
                icone={Trash2}
                onClick={() => remover(indice)}
                rotulo={`Remover condição ${indice + 1}`}
              />
            </div>
            <CondicaoDeCampo
              campos={campos}
              condicao={condicao}
              erros={temCampo ? { valor: erro } : { campo: erro }}
              idBase={`${idBase}-${chaves[indice]}`}
              onChange={(proxima) => alterar(indice, proxima)}
              rotuloCampo="Campo"
            />
          </div>
        );
      })}

      <div>
        <Button disabled={cheia} onClick={adicionar} size="sm" type="button" variant="outline">
          <Plus aria-hidden="true" />
          Adicionar condição
        </Button>
        {cheia && (
          <p className="mt-1 text-xs text-muted-foreground">
            Máximo de {maximo} condições por regra.
          </p>
        )}
      </div>
    </fieldset>
  );
}
