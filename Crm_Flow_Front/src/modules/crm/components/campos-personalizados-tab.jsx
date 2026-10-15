import { ArrowDown, ArrowUp, Pencil, Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { ModulePlaceholder } from '@/components/module-placeholder';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ROTULOS_TIPO } from '../constants';
import { useReordenarDefinicoes } from '../hooks/use-campos-config';
import { proximaOrdem, reordenar } from '../lib/campos-config';
import { DefinicaoDialog } from './definicao-dialog';
import { ExcluirDefinicaoDialog } from './excluir-definicao-dialog';

const HEAD_CLASS = 'font-mono text-[11px] font-normal uppercase tracking-wide text-muted-foreground';
const SUBIR = -1;
const DESCER = 1;

function BotaoIcone({ rotulo, icone: Icone, ...props }) {
  return (
    <Button aria-label={rotulo} className="rounded-none" size="icon-sm" title={rotulo} variant="ghost" {...props}>
      <Icone aria-hidden="true" />
    </Button>
  );
}

/**
 * Camada 3: campos criados pelo tenant. A ordem muda com ↑/↓ — a
 * alternativa acessível ao drag-and-drop, que pode vir depois.
 *
 * @param {{
 *   definicoes: import('../lib/campos-config').Definicao[],
 *   campos: { ordem: number }[],
 * }} props `campos` = todos de `/fields`, para o novo campo entrar no fim
 */
export function CamposPersonalizadosTab({ definicoes, campos }) {
  // `undefined` = fechado; `null` = criando; objeto = editando.
  const [emEdicao, setEmEdicao] = useState(undefined);
  const [aExcluir, setAExcluir] = useState(null);
  const [aviso, setAviso] = useState(null);
  const reordenarMutacao = useReordenarDefinicoes();

  function mover(id, direcao) {
    const ordens = reordenar(definicoes, id, direcao);
    if (ordens.length > 0) reordenarMutacao.mutate(ordens);
  }

  const botaoNovo = (
    <Button onClick={() => { setAviso(null); setEmEdicao(null); }}>
      <Plus aria-hidden="true" />
      Novo campo
    </Button>
  );

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Campos próprios da sua operação. A chave é gerada a partir do nome na criação.
        </p>
        {definicoes.length > 0 && botaoNovo}
      </div>

      <p className={aviso ? 'border border-border px-3 py-2 text-sm' : 'sr-only'} role="status">
        {aviso}
      </p>
      <ApiErrorAlert error={reordenarMutacao.error} id="reordenar-erro" title="Não foi possível reordenar" />

      {definicoes.length === 0 ? (
        <ModulePlaceholder
          description="Crie campos como plano contratado, renda ou data de aniversário."
          icon={SlidersHorizontal}
          title="Nenhum campo personalizado"
        >
          {botaoNovo}
        </ModulePlaceholder>
      ) : (
        <div className="overflow-x-auto border border-border" aria-busy={reordenarMutacao.isPending}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={HEAD_CLASS} scope="col">Campo</TableHead>
                <TableHead className={HEAD_CLASS} scope="col">Chave</TableHead>
                <TableHead className={HEAD_CLASS} scope="col">Tipo</TableHead>
                <TableHead className={HEAD_CLASS} scope="col">Obrigatório</TableHead>
                <TableHead scope="col"><span className="sr-only">Ações</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {definicoes.map((definicao, indice) => (
                <TableRow key={definicao.id}>
                  <TableCell className="font-medium">
                    {definicao.label}
                    {definicao.opcoes?.length > 0 && (
                      <span className="block text-xs font-normal text-muted-foreground">
                        {definicao.opcoes.join(', ')}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{definicao.chave}</TableCell>
                  <TableCell>{ROTULOS_TIPO[definicao.tipo] ?? definicao.tipo}</TableCell>
                  <TableCell>{definicao.obrigatorio ? 'Sim' : 'Não'}</TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <BotaoIcone
                      disabled={indice === 0 || reordenarMutacao.isPending}
                      icone={ArrowUp}
                      onClick={() => mover(definicao.id, SUBIR)}
                      rotulo={`Subir ${definicao.label}`}
                    />
                    <BotaoIcone
                      disabled={indice === definicoes.length - 1 || reordenarMutacao.isPending}
                      icone={ArrowDown}
                      onClick={() => mover(definicao.id, DESCER)}
                      rotulo={`Descer ${definicao.label}`}
                    />
                    <BotaoIcone
                      icone={Pencil}
                      onClick={() => { setAviso(null); setEmEdicao(definicao); }}
                      rotulo={`Editar ${definicao.label}`}
                    />
                    <BotaoIcone
                      icone={Trash2}
                      onClick={() => { setAviso(null); setAExcluir(definicao); }}
                      rotulo={`Excluir ${definicao.label}`}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <DefinicaoDialog
        definicao={emEdicao}
        onOpenChange={(aberto) => !aberto && setEmEdicao(undefined)}
        onSalvo={() => setAviso(emEdicao ? 'Campo atualizado.' : 'Campo criado.')}
        open={emEdicao !== undefined}
        proximaOrdem={proximaOrdem([...campos, ...definicoes])}
      />
      <ExcluirDefinicaoDialog
        definicao={aExcluir}
        onExcluido={setAviso}
        onOpenChange={(aberto) => !aberto && setAExcluir(null)}
      />
    </div>
  );
}
