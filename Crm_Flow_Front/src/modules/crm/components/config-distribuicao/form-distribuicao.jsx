import { Pencil, Plus, Shuffle, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { ModulePlaceholder } from '@/components/module-placeholder';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { semChave } from '@/lib/objetos';
import { cn } from '@/lib/utils';
import { toApiError } from '@/services/api';
import { DISTRIBUICAO, ROTULOS_FALLBACK } from '../../constants';
import { useSalvarDistribuicao } from '../../hooks/use-distribuicao';
import {
  descreverCondicoes,
  distribuicaoMudou,
  distribuicaoParaEnvio,
  errosDoPut,
  nomeDoDestino,
  novaRegra,
  podeAdicionarRegra,
  valoresDaDistribuicao,
} from '../../lib/distribuicao';
import { moverPara } from '../../lib/ordem';
import { BotaoIcone } from '../botao-icone';
import { BotoesOrdem } from '../ordenavel/botoes-ordem';
import { ListaOrdenavel } from '../ordenavel/lista-ordenavel';
import { PuxadorOrdem } from '../ordenavel/puxador-ordem';
import { useLinhaOrdenavel } from '../ordenavel/use-linha-ordenavel';
import { SelectSimples } from '../select-simples';
import { RegraDistribuicaoDialog } from './regra-distribuicao-dialog';

const OPCOES_FALLBACK = Object.entries(ROTULOS_FALLBACK).map(([valor, rotulo]) => ({
  valor,
  rotulo,
}));
const SEM_ERROS = Object.freeze({ porRegra: {}, outros: [] });

/** Uma regra do rascunho: posição, nome, frase, liga/desliga e ações. */
function LinhaRegra({
  regra,
  indice,
  total,
  descricao,
  destino,
  erro,
  podeEditar,
  ocupado,
  onMover,
  onAlternar,
  onEditar,
  onRemover,
}) {
  const { linha, puxador } = useLinhaOrdenavel(regra.chaveLocal, !podeEditar || ocupado);
  const nome = regra.nome || 'Regra sem nome';
  const idAtiva = `distribuicao-${regra.chaveLocal}-ativa`;
  const idErro = `distribuicao-${regra.chaveLocal}-erro`;

  return (
    <li
      {...linha}
      aria-describedby={erro ? idErro : undefined}
      className={cn(
        'flex flex-wrap items-center gap-3 border-b border-border px-3 py-2 last:border-b-0',
        erro && 'bg-destructive/5',
        linha.className,
      )}
    >
      {podeEditar && <PuxadorOrdem {...puxador} rotulo={nome} />}
      <span className="w-6 font-mono text-xs text-muted-foreground tabular-nums">
        {indice + 1}.
      </span>

      <div className="grid min-w-0 flex-1 gap-0.5">
        <p className="text-sm font-medium">{nome}</p>
        <p className="text-sm text-muted-foreground">
          {descricao} <span aria-hidden="true">→</span>
          <span className="sr-only">, vai para</span>{' '}
          <span className="text-foreground">{destino}</span>
        </p>
        {erro && (
          <p className="text-xs text-destructive" id={idErro}>
            {erro}
          </p>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm" htmlFor={idAtiva}>
        <Switch
          checked={regra.ativo}
          disabled={!podeEditar || ocupado}
          id={idAtiva}
          onCheckedChange={onAlternar}
        />
        {regra.ativo ? 'Ligada' : 'Desligada'}
        <span className="sr-only">: {nome}</span>
      </label>

      {podeEditar && (
        <div className="flex whitespace-nowrap">
          <BotoesOrdem
            desabilitado={ocupado}
            indice={indice}
            onMover={onMover}
            rotulo={nome}
            total={total}
          />
          <BotaoIcone
            disabled={ocupado}
            icone={Pencil}
            onClick={onEditar}
            rotulo={`Editar ${nome}`}
          />
          <BotaoIcone
            disabled={ocupado}
            icone={Trash2}
            onClick={onRemover}
            rotulo={`Remover ${nome}`}
          />
        </div>
      )}
    </li>
  );
}

/**
 * O rascunho da distribuição: liga/desliga, fallback e as regras na ordem de
 * avaliação. Nada sai daqui até o "Salvar", que manda tudo num PUT. Montado
 * com `key` pela configuração salva (sem os grupos — ver `chaveDaConfig`).
 *
 * @param {{
 *   config: import('../../api/distribuicao.api').ConfigDistribuicao,
 *   campos: import('../../types').Campo[],
 *   nomePorId: Map<string, string>,
 *   opcoesDestino: { valor: string, rotulo: string }[],
 *   podeEditar: boolean,
 *   onSalvo: (aviso: string) => void,
 * }} props
 */
export function FormDistribuicao({
  config,
  campos,
  nomePorId,
  opcoesDestino,
  podeEditar,
  onSalvo,
}) {
  const [valores, setValores] = useState(() => valoresDaDistribuicao(config, campos));
  const [erros, setErros] = useState(SEM_ERROS);
  // `undefined` = fechado; `{ regra, nova }` = editando no dialog.
  const [emEdicao, setEmEdicao] = useState(undefined);
  const novas = useRef(0);
  const salvar = useSalvarDistribuicao();
  const mudou = distribuicaoMudou(valores, config, campos);
  const ocupado = salvar.isPending || !podeEditar;
  const ids = valores.regras.map((regra) => regra.chaveLocal);
  const comErroDeRegra = Object.keys(erros.porRegra).length > 0;

  function alterar(parcial) {
    setValores((atuais) => ({ ...atuais, ...parcial }));
    if (salvar.error) {
      salvar.reset();
    }
  }

  function alterarRegras(regras) {
    alterar({ regras });
  }

  function mover(de, para) {
    const proximos = moverPara(valores.regras, de, para);
    if (proximos !== valores.regras) {
      alterarRegras(proximos);
    }
  }

  function confirmarRegra(confirmada) {
    const existe = valores.regras.some((regra) => regra.chaveLocal === confirmada.chaveLocal);
    alterarRegras(
      existe
        ? valores.regras.map((regra) =>
            regra.chaveLocal === confirmada.chaveLocal ? confirmada : regra,
          )
        : [...valores.regras, confirmada],
    );
    // A regra foi revista: o erro dela sai.
    setErros(({ porRegra, outros }) => ({
      porRegra: semChave(porRegra, confirmada.chaveLocal),
      outros,
    }));
  }

  function remover(chaveLocal) {
    alterarRegras(valores.regras.filter((regra) => regra.chaveLocal !== chaveLocal));
    setErros(({ porRegra, outros }) => ({ porRegra: semChave(porRegra, chaveLocal), outros }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const resultado = distribuicaoParaEnvio(valores, campos);
    if ('erros' in resultado) {
      setErros({ porRegra: resultado.erros, outros: resultado.geral ? [resultado.geral] : [] });
      return;
    }

    setErros(SEM_ERROS);
    const enviadas = valores.regras.map((regra) => regra.chaveLocal);
    salvar.mutate(resultado.corpo, {
      onSuccess: () => onSalvo('Distribuição salva.'),
      onError: (erro) => setErros(errosDoPut(toApiError(erro).fields, enviadas)),
    });
  }

  function descartar() {
    setValores(valoresDaDistribuicao(config, campos));
    setErros(SEM_ERROS);
    salvar.reset();
  }

  const botaoNovaRegra = podeEditar && (
    <Button
      disabled={ocupado || !podeAdicionarRegra(valores)}
      onClick={() => setEmEdicao({ regra: novaRegra(`nova-${++novas.current}`), nova: true })}
      size="sm"
      type="button"
      variant="outline"
    >
      <Plus aria-hidden="true" />
      Nova regra
    </Button>
  );

  return (
    <>
      <form className="grid gap-5" noValidate onSubmit={handleSubmit}>
        <div className="grid max-w-2xl gap-4">
          <label className="flex items-center gap-2 text-sm" htmlFor="distribuicao-ativo">
            <Switch
              checked={valores.ativo}
              disabled={ocupado}
              id="distribuicao-ativo"
              onCheckedChange={(ativo) => alterar({ ativo })}
            />
            Distribuir leads novos automaticamente
          </label>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium" htmlFor="distribuicao-fallback">
              Quando nenhuma regra casar
            </label>
            <SelectSimples
              className="max-w-xs"
              disabled={ocupado}
              id="distribuicao-fallback"
              onChange={(fallback) => fallback && alterar({ fallback })}
              opcoes={OPCOES_FALLBACK}
              value={valores.fallback}
            />
          </div>
        </div>

        <section aria-labelledby="distribuicao-regras-titulo" className="grid gap-2">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="grid gap-0.5">
              <h3 className="text-sm font-medium" id="distribuicao-regras-titulo">
                Regras
              </h3>
              <p className="text-xs text-muted-foreground">
                Avaliadas de cima para baixo: a primeira que casar define o responsável.
                {valores.regras.length > 0 && (
                  <span className="font-mono">
                    {' '}
                    {valores.regras.length}/{DISTRIBUICAO.MAX_REGRAS}
                  </span>
                )}
              </p>
            </div>
            {valores.regras.length > 0 && botaoNovaRegra}
          </div>

          {valores.regras.length === 0 ? (
            <ModulePlaceholder
              description="Sem regras, todo lead novo segue o que está escolhido em “Quando nenhuma regra casar”."
              icon={Shuffle}
              title="Nenhuma regra ainda"
            >
              {botaoNovaRegra}
            </ModulePlaceholder>
          ) : (
            <ListaOrdenavel
              ids={ids}
              onMover={mover}
              rotuloDe={(id) =>
                valores.regras.find((regra) => regra.chaveLocal === id)?.nome || 'Regra sem nome'
              }
            >
              <ul aria-busy={salvar.isPending} className="border border-border">
                {valores.regras.map((regra, indice) => {
                  const doServidor = erros.porRegra[regra.chaveLocal];

                  return (
                    <LinhaRegra
                      descricao={descreverCondicoes(regra, campos, nomePorId)}
                      destino={nomeDoDestino(regra.destino, nomePorId, config.grupos)}
                      erro={
                        doServidor ? `Revise esta regra: ${Object.values(doServidor)[0]}` : null
                      }
                      indice={indice}
                      key={regra.chaveLocal}
                      ocupado={ocupado}
                      onAlternar={(ativo) =>
                        alterarRegras(
                          valores.regras.map((atual) =>
                            atual === regra ? { ...atual, ativo } : atual,
                          ),
                        )
                      }
                      onEditar={() => setEmEdicao({ regra, nova: false })}
                      onMover={mover}
                      onRemover={() => remover(regra.chaveLocal)}
                      podeEditar={podeEditar}
                      regra={regra}
                      total={valores.regras.length}
                    />
                  );
                })}
              </ul>
            </ListaOrdenavel>
          )}
        </section>

        {erros.outros.length > 0 && (
          <ul
            className="grid gap-1 border border-destructive px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {erros.outros.map((mensagem) => (
              <li key={mensagem}>{mensagem}</li>
            ))}
          </ul>
        )}
        {comErroDeRegra && (
          <p className="text-sm text-destructive" role="alert">
            Há regras para revisar (marcadas acima).
          </p>
        )}
        {salvar.error && !comErroDeRegra && erros.outros.length === 0 && (
          <ApiErrorAlert
            error={salvar.error}
            id="distribuicao-erro"
            title="Não foi possível salvar"
          />
        )}

        {podeEditar && (
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button aria-busy={salvar.isPending} disabled={!mudou || ocupado} type="submit">
              {salvar.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
            <Button
              disabled={!mudou || ocupado}
              onClick={descartar}
              type="button"
              variant="outline"
            >
              Descartar
            </Button>
          </div>
        )}
      </form>

      {/* Fora do <form>: o submit do dialog sobe pela árvore do React (portal) e salvaria a seção. */}
      <RegraDistribuicaoDialog
        campos={campos}
        errosDoServidor={emEdicao ? erros.porRegra[emEdicao.regra.chaveLocal] : undefined}
        nova={Boolean(emEdicao?.nova)}
        onConfirmar={confirmarRegra}
        onOpenChange={(aberto) => !aberto && setEmEdicao(undefined)}
        opcoesDestino={opcoesDestino}
        regra={emEdicao?.regra ?? null}
      />
    </>
  );
}
