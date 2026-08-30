import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { ModulePlaceholder } from '@/components/module-placeholder';
import { Button } from '@/components/ui/button';
import { BotaoIcone } from '../botao-icone';
import { ExcluirGrupoDialog } from './excluir-grupo-dialog';
import { GrupoDialog } from './grupo-dialog';

/** "Ana, Bia e mais 3" — membro desativado não aparece. */
function textoDosMembros(membros, nomePorId) {
  const nomes = membros.map((id) => nomePorId.get(id)).filter(Boolean);
  if (nomes.length === 0) {
    return 'Nenhum membro ativo';
  }
  const MAX_NOMES = 3;
  if (nomes.length <= MAX_NOMES) {
    return nomes.join(', ');
  }
  return `${nomes.slice(0, MAX_NOMES).join(', ')} e mais ${nomes.length - MAX_NOMES}`;
}

/**
 * Grupos de distribuição: salvam na hora (fora do rascunho das regras). O
 * grupo é destino de regra; excluir um em uso dá 409.
 *
 * @param {{
 *   grupos: import('../../api/distribuicao.api').GrupoDistribuicao[],
 *   usuarios: { id: string, nome: string }[],
 *   nomePorId: Map<string, string>,
 *   podeEditar: boolean,
 *   onAviso: (aviso: string) => void,
 * }} props
 */
export function GruposDistribuicao({ grupos, usuarios, nomePorId, podeEditar, onAviso }) {
  // `undefined` = fechado; `null` = criando; objeto = editando.
  const [emEdicao, setEmEdicao] = useState(undefined);
  const [aExcluir, setAExcluir] = useState(null);

  const botaoNovo = podeEditar && (
    <Button onClick={() => setEmEdicao(null)} size="sm" type="button" variant="outline">
      <Plus aria-hidden="true" />
      Novo grupo
    </Button>
  );

  return (
    <section
      aria-labelledby="distribuicao-grupos-titulo"
      className="grid gap-2 border-t border-border pt-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-0.5">
          <h3 className="text-sm font-medium" id="distribuicao-grupos-titulo">
            Grupos
          </h3>
          <p className="text-xs text-muted-foreground">
            Usuários que recebem em rodízio. Salvam na hora.
          </p>
        </div>
        {grupos.length > 0 && botaoNovo}
      </div>

      {grupos.length === 0 ? (
        <ModulePlaceholder
          description="Crie um grupo para dividir os leads de uma regra entre várias pessoas."
          icon={Users}
          title="Nenhum grupo ainda"
        >
          {botaoNovo}
        </ModulePlaceholder>
      ) : (
        <ul className="border border-border">
          {grupos.map((grupo) => (
            <li
              className="flex flex-wrap items-center gap-3 border-b border-border px-3 py-2 last:border-b-0"
              key={grupo.id}
            >
              <div className="grid min-w-0 flex-1 gap-0.5">
                <p className="text-sm font-medium">{grupo.nome}</p>
                <p className="text-sm text-muted-foreground">
                  {textoDosMembros(grupo.membros, nomePorId)}
                </p>
              </div>
              {podeEditar && (
                <div className="flex">
                  <BotaoIcone
                    icone={Pencil}
                    onClick={() => setEmEdicao(grupo)}
                    rotulo={`Editar grupo ${grupo.nome}`}
                  />
                  <BotaoIcone
                    icone={Trash2}
                    onClick={() => setAExcluir(grupo)}
                    rotulo={`Excluir grupo ${grupo.nome}`}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <GrupoDialog
        grupo={emEdicao}
        onOpenChange={(aberto) => !aberto && setEmEdicao(undefined)}
        onSalvo={(salvo) =>
          onAviso(emEdicao ? `Grupo "${salvo.nome}" atualizado.` : `Grupo "${salvo.nome}" criado.`)
        }
        open={emEdicao !== undefined}
        usuarios={usuarios}
      />
      <ExcluirGrupoDialog
        grupo={aExcluir}
        onExcluido={(nome) => onAviso(`Grupo "${nome}" excluído.`)}
        onOpenChange={(aberto) => !aberto && setAExcluir(null)}
      />
    </section>
  );
}
