import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LIMITES_LAYOUT } from '../../constants';
import { moverPara } from '../../lib/ordem';
import { BotaoIcone } from '../botao-icone';
import { BotoesOrdem } from '../ordenavel/botoes-ordem';
import { SeletorOrdenado } from './seletor-ordenado';

const NOVA_SECAO = Object.freeze({ nome: '', campos: [] });

/**
 * Seções da ficha. Um campo fica em uma seção só: cada seção oferece os
 * campos que nenhuma outra usa. O que sobrar vai, sozinho, para a seção
 * automática no fim ("Outros campos"), que o back calcula e não se edita.
 *
 * @param {{
 *   secoes: { nome: string, campos: string[] }[],
 *   opcoes: { ref: string, label: string }[],
 *   automatica: { nome: string, campos: { label: string }[] } | null,
 *   erro?: string | null,
 *   onChange: (secoes: { nome: string, campos: string[] }[]) => void,
 * }} props
 */
export function EditorSecoes({ secoes, opcoes, automatica, erro, onChange }) {
  const cheio = secoes.length >= LIMITES_LAYOUT.SECOES;

  function alterar(indice, mudancas) {
    onChange(secoes.map((secao, atual) => (atual === indice ? { ...secao, ...mudancas } : secao)));
  }

  function mover(de, para) {
    const proximas = moverPara(secoes, de, para);
    if (proximas !== secoes) onChange(proximas);
  }

  return (
    <section aria-labelledby="layout-secoes-titulo" className="grid gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium" id="layout-secoes-titulo">
          Seções da ficha
        </h3>
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
          {secoes.length}/{LIMITES_LAYOUT.SECOES}
        </span>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">
        Agrupam os campos no drawer do lead. Sem seções, tudo aparece em "Dados do lead".
      </p>

      {secoes.map((secao, indice) => {
        const usadosEmOutras = new Set(secoes.flatMap((outra, atual) => (atual === indice ? [] : outra.campos)));
        const rotulo = secao.nome.trim() || `Seção ${indice + 1}`;

        return (
          <div className="grid gap-3 border border-border p-3" key={indice}>
            <div className="flex items-center gap-1">
              <Input
                aria-label={`Nome da seção ${indice + 1}`}
                className="h-9 flex-1 rounded-none"
                maxLength={LIMITES_LAYOUT.NOME_SECAO}
                onChange={(event) => alterar(indice, { nome: event.target.value })}
                placeholder="Nome da seção"
                value={secao.nome}
              />
              <BotoesOrdem desabilitado={false} indice={indice} onMover={mover} rotulo={rotulo} total={secoes.length} />
              <BotaoIcone
                icone={Trash2}
                onClick={() => onChange(secoes.filter((_, atual) => atual !== indice))}
                rotulo={`Remover ${rotulo}`}
              />
            </div>
            <SeletorOrdenado
              id={`layout-secao-${indice}`}
              legenda={`Campos de ${rotulo}`}
              onChange={(campos) => alterar(indice, { campos })}
              opcoes={opcoes.filter((opcao) => !usadosEmOutras.has(opcao.ref))}
              valor={secao.campos}
            />
          </div>
        );
      })}

      <div>
        <Button disabled={cheio} onClick={() => onChange([...secoes, { ...NOVA_SECAO }])} type="button" variant="outline">
          <Plus aria-hidden="true" />
          Nova seção
        </Button>
      </div>

      {erro && (
        <p className="text-xs text-destructive" role="alert">
          {erro}
        </p>
      )}

      {automatica && automatica.campos.length > 0 && (
        <p className="border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{automatica.nome}</span> (automática, no fim):{' '}
          {automatica.campos.map((campo) => campo.label).join(', ')}. Atualiza ao salvar.
        </p>
      )}
    </section>
  );
}
