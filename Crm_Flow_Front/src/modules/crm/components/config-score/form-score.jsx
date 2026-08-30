import { Pencil, Plus, Sigma, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { ModulePlaceholder } from '@/components/module-placeholder';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { semChave } from '@/lib/objetos';
import { toApiError } from '@/services/api';
import { SCORE } from '../../constants';
import { descreverCondicoes } from '../../lib/condicoes';
import { errosPorItem } from '../../lib/erros-de-lista';
import {
  novaFaixa,
  novaRegraScore,
  scoreMudou,
  scoreParaEnvio,
  textoDosPontos,
  valoresDoScore,
} from '../../lib/score';
import { BotaoIcone } from '../botao-icone';
import { RegraScoreDialog } from './regra-score-dialog';
import { TabelaFaixas } from './tabela-faixas';

const SEM_ERROS = Object.freeze({ regras: {}, faixas: {}, geral: [] });
// Caminhos de um item (`regras.<n>…`, `faixas.<n>…`); o resto é da lista inteira.
const CAMINHO_DE_ITEM = /^(regras|faixas)\.\d+/;

/** 400 do PUT → erros do rascunho (por `chaveLocal`, na ordem enviada). */
function errosDoServidor(fields, chavesDasRegras, chavesDasFaixas) {
  return {
    regras: errosPorItem(fields, 'regras', chavesDasRegras).porItem,
    faixas: errosPorItem(fields, 'faixas', chavesDasFaixas).porItem,
    geral: Object.entries(fields ?? {})
      .filter(([caminho]) => !CAMINHO_DE_ITEM.test(caminho))
      .map(([, mensagens]) => (Array.isArray(mensagens) ? mensagens[0] : String(mensagens))),
  };
}

/** Uma regra do rascunho: nome, condições, pontos com sinal, liga/desliga e ações. */
function LinhaRegra({
  regra,
  descricao,
  erro,
  podeEditar,
  ocupado,
  onAlternar,
  onEditar,
  onRemover,
}) {
  const nome = regra.nome || 'Regra sem nome';
  const idAtiva = `score-${regra.chaveLocal}-ativa`;
  const idErro = `score-${regra.chaveLocal}-erro`;

  return (
    <li
      aria-describedby={erro ? idErro : undefined}
      className="flex flex-wrap items-center gap-3 border-b border-border px-3 py-2 last:border-b-0"
    >
      <span className="w-14 text-right font-mono text-sm tabular-nums">
        {textoDosPontos(regra.pontos)}
      </span>
      <div className="grid min-w-0 flex-1 gap-0.5">
        <p className="text-sm font-medium">{nome}</p>
        <p className="text-sm text-muted-foreground">{descricao}</p>
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
        <div className="flex">
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
 * O rascunho da pontuação: regras e faixas. Nada sai daqui até o "Salvar",
 * que manda tudo num PUT e só responde depois de recalcular os leads.
 * A mutação vem da seção (ela fica montada enquanto o PUT roda, mesmo que o
 * progresso recarregue a configuração).
 *
 * @param {{
 *   config: import('../../api/score.api').ConfigScore,
 *   campos: import('../../types').Campo[],
 *   nomePorId: Map<string, string>,
 *   podeEditar: boolean,
 *   ocupado: boolean,
 *   salvar: ReturnType<typeof import('../../hooks/use-score').useSalvarScore>,
 *   onSalvo: (aviso: string) => void,
 * }} props `ocupado`: salvando ou recalculando
 */
export function FormScore({ config, campos, nomePorId, podeEditar, ocupado, salvar, onSalvo }) {
  const [valores, setValores] = useState(() => valoresDoScore(config, campos));
  const [erros, setErros] = useState(SEM_ERROS);
  // `undefined` = fechado; `{ regra, nova }` = editando no dialog.
  const [emEdicao, setEmEdicao] = useState(undefined);
  const novos = useRef(0);
  const mudou = scoreMudou(valores, config, campos);
  const travado = ocupado || !podeEditar;
  const comErro =
    erros.geral.length > 0 ||
    Object.keys(erros.regras).length > 0 ||
    Object.keys(erros.faixas).length > 0;

  function alterar(parcial) {
    setValores((atuais) => ({ ...atuais, ...parcial }));
    if (salvar.error) {
      salvar.reset();
    }
  }

  function confirmarRegra(confirmada) {
    const existe = valores.regras.some((regra) => regra.chaveLocal === confirmada.chaveLocal);
    alterar({
      regras: existe
        ? valores.regras.map((regra) =>
            regra.chaveLocal === confirmada.chaveLocal ? confirmada : regra,
          )
        : [...valores.regras, confirmada],
    });
    setErros((atuais) => ({ ...atuais, regras: semChave(atuais.regras, confirmada.chaveLocal) }));
  }

  function removerRegra(chaveLocal) {
    alterar({ regras: valores.regras.filter((regra) => regra.chaveLocal !== chaveLocal) });
    setErros((atuais) => ({ ...atuais, regras: semChave(atuais.regras, chaveLocal) }));
  }

  function alterarFaixa(chaveLocal, parcial) {
    alterar({
      faixas: valores.faixas.map((faixa) =>
        faixa.chaveLocal === chaveLocal ? { ...faixa, ...parcial } : faixa,
      ),
    });
    setErros((atuais) => ({ ...atuais, faixas: semChave(atuais.faixas, chaveLocal), geral: [] }));
  }

  function removerFaixa(chaveLocal) {
    alterar({ faixas: valores.faixas.filter((faixa) => faixa.chaveLocal !== chaveLocal) });
    setErros((atuais) => ({ ...atuais, faixas: semChave(atuais.faixas, chaveLocal), geral: [] }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const resultado = scoreParaEnvio(valores, campos);
    if ('erros' in resultado) {
      setErros(resultado.erros);
      return;
    }

    setErros(SEM_ERROS);
    const chavesDasRegras = valores.regras.map((regra) => regra.chaveLocal);
    const chavesDasFaixas = valores.faixas.map((faixa) => faixa.chaveLocal);
    salvar.mutate(resultado.corpo, {
      onSuccess: () => onSalvo('Pontuação salva e leads recalculados.'),
      onError: (erro) =>
        setErros(errosDoServidor(toApiError(erro).fields, chavesDasRegras, chavesDasFaixas)),
    });
  }

  function descartar() {
    setValores(valoresDoScore(config, campos));
    setErros(SEM_ERROS);
    salvar.reset();
  }

  const botaoNovaRegra = podeEditar && (
    <Button
      disabled={travado || valores.regras.length >= SCORE.MAX_REGRAS}
      onClick={() =>
        setEmEdicao({ regra: novaRegraScore(`nova-regra-${++novos.current}`), nova: true })
      }
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
      <form className="grid gap-6" noValidate onSubmit={handleSubmit}>
        <section aria-labelledby="score-regras-titulo" className="grid gap-2">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="grid gap-0.5">
              <h3 className="text-sm font-medium" id="score-regras-titulo">
                Regras
              </h3>
              <p className="text-xs text-muted-foreground">
                O score do lead é a soma dos pontos de todas as regras ligadas que ele cumpre.
              </p>
            </div>
            {valores.regras.length > 0 && botaoNovaRegra}
          </div>

          {valores.regras.length === 0 ? (
            <ModulePlaceholder
              description="Sem regras, todo lead fica com score 0."
              icon={Sigma}
              title="Nenhuma regra ainda"
            >
              {botaoNovaRegra}
            </ModulePlaceholder>
          ) : (
            <ul aria-busy={ocupado} className="border border-border">
              {valores.regras.map((regra) => {
                const daRegra = erros.regras[regra.chaveLocal];

                return (
                  <LinhaRegra
                    descricao={descreverCondicoes(regra, campos, nomePorId)}
                    erro={daRegra ? `Revise esta regra: ${Object.values(daRegra)[0]}` : null}
                    key={regra.chaveLocal}
                    ocupado={travado}
                    onAlternar={(ativo) =>
                      alterar({
                        regras: valores.regras.map((atual) =>
                          atual === regra ? { ...atual, ativo } : atual,
                        ),
                      })
                    }
                    onEditar={() => setEmEdicao({ regra, nova: false })}
                    onRemover={() => removerRegra(regra.chaveLocal)}
                    podeEditar={podeEditar}
                    regra={regra}
                  />
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="score-faixas-titulo" className="grid gap-2">
          <div className="grid gap-0.5">
            <h3 className="text-sm font-medium" id="score-faixas-titulo">
              Faixas
            </h3>
            <p className="text-xs text-muted-foreground">
              Dão nome e cor ao score na tabela e no lead. Limites inclusivos; vazio = sem limite.
              {!config.faixasConfiguradas && ' A empresa ainda usa as faixas padrão.'}
            </p>
          </div>
          <TabelaFaixas
            erros={erros.faixas}
            faixas={valores.faixas}
            ocupado={ocupado}
            onAdicionar={() =>
              alterar({ faixas: [...valores.faixas, novaFaixa(`nova-faixa-${++novos.current}`)] })
            }
            onAlterar={alterarFaixa}
            onRemover={removerFaixa}
            podeEditar={podeEditar}
          />
        </section>

        {erros.geral.length > 0 && (
          <ul
            className="grid gap-1 border border-destructive px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {erros.geral.map((mensagem) => (
              <li key={mensagem}>{mensagem}</li>
            ))}
          </ul>
        )}
        {salvar.error && !comErro && (
          <ApiErrorAlert error={salvar.error} id="score-erro" title="Não foi possível salvar" />
        )}

        {podeEditar && (
          <div className="grid gap-2 border-t border-border pt-4">
            <div className="flex flex-wrap gap-2">
              <Button aria-busy={salvar.isPending} disabled={!mudou || travado} type="submit">
                {salvar.isPending ? 'Salvando e recalculando…' : 'Salvar'}
              </Button>
              <Button
                disabled={!mudou || travado}
                onClick={descartar}
                type="button"
                variant="outline"
              >
                Descartar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Salvar recalcula a pontuação de todos os leads.
            </p>
          </div>
        )}
      </form>

      {/* Fora do <form>: o submit do dialog sobe pela árvore do React (portal) e salvaria a seção. */}
      <RegraScoreDialog
        campos={campos}
        errosDoServidor={emEdicao ? erros.regras[emEdicao.regra.chaveLocal] : undefined}
        nova={Boolean(emEdicao?.nova)}
        onConfirmar={confirmarRegra}
        onOpenChange={(aberto) => !aberto && setEmEdicao(undefined)}
        regra={emEdicao?.regra ?? null}
      />
    </>
  );
}
