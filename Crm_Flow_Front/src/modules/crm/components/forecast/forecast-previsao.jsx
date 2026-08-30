/**
 * @file Gráfico, blocos, grupos e a lista aberta, a partir de uma resposta já carregada.
 */
import { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { AcessoIndisponivel } from '@/components/acesso-indisponivel';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { MetricsSkeleton } from '@/components/loading-skeletons';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { isAccessError } from '@/services/api';

import { FORECAST, PAPEIS_GESTAO, TIPOS_MES } from '../../constants';
import { useCampos } from '../../hooks/use-campos';
import { useForecast, useListaDoForecast } from '../../hooks/use-forecast';
import { usePipelines } from '../../hooks/use-pipelines';
import { useSelecaoLeads } from '../../hooks/use-selecao-leads';
import { useUsuarios } from '../../hooks/use-usuarios';
import {
  chaveDaSelecao,
  erroDoForecast,
  escreverConsulta,
  lerConsulta,
  opcoesDeAgrupar,
  paramsDaLista,
  paramsDoForecast,
  pipelinesDoForecast,
  podeAtualizarData,
  tiposDaLista,
  validarPeriodo,
  veCampoStatus,
} from '../../lib/forecast';
import {
  contadorSelecao,
  rotuloDoMes,
  ROTULOS_BLOCO,
  ROTULOS_TIPO_MES,
  TEXTOS_FORECAST,
} from '../../lib/forecast-textos';
import {
  cardsDosBlocos,
  colunasDaLista,
  linhasDosGrupos,
  semResultado,
  serieDoGrafico,
} from '../../lib/forecast-vista';
import { ROTAS_CRM } from '../../rotas';
import { AtualizarDataDialog } from './atualizar-data-dialog';
import { AvisoCamposDesligados } from './aviso-campos-desligados';
import { CardsBlocos } from './cards-blocos';
import { FiltrosForecast } from './filtros-forecast';
import { ForecastVazio } from './forecast-vazio';
import { GraficoForecast } from './grafico-forecast';
import { GruposForecast } from './grupos-forecast';
import { ListaDoForecast } from './lista-do-forecast';
import { TabelaForecast } from './tabela-forecast';

const SEM_ITENS = [];

const maiuscula = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

/** Título da lista aberta: o mês (com o tipo, se não houver abas) ou o bloco. */
function tituloDaLista(lista, comAbas) {
  if ('bloco' in lista) {
    return ROTULOS_BLOCO[lista.bloco];
  }

  const mes = maiuscula(rotuloDoMes(lista.mes));

  return comAbas ? mes : `${mes} · ${ROTULOS_TIPO_MES[lista.tipo]}`;
}

/**
 * Aba Previsão do Forecast (FC2, `crm.forecast`): realizado, ponderado e
 * melhor caso por mês, os blocos fora dos meses e a lista por trás de cada
 * número. A consulta mora na URL (`lib/forecast.js`); os números vêm prontos
 * do back e nada é recalculado aqui. A ficha abre por cima, pela página.
 */
export function ForecastPrevisao() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { search } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const consulta = lerConsulta(searchParams);

  // Período sendo digitado: só vai para a URL quando é válido.
  const [rascunho, setRascunho] = useState(null);
  const [dialogAberto, setDialogAberto] = useState(false);

  const errosDaUrl = validarPeriodo(consulta.de, consulta.ate);
  const periodoDaUrlValido = Object.keys(errosDaUrl).length === 0;
  const params = paramsDoForecast(
    periodoDaUrlValido ? consulta : { ...consulta, de: null, ate: null },
  );

  const forecastQuery = useForecast(params);
  const camposQuery = useCampos();
  const pipelinesQuery = usePipelines();
  const { usuarios, nomePorId } = useUsuarios();

  const resposta = forecastQuery.data;
  const periodo = resposta?.periodo;
  const campos = camposQuery.data;
  const paramsLista = resposta ? paramsDaLista(consulta, periodo) : null;
  const listaQuery = useListaDoForecast(paramsLista);

  const comAcao = Boolean(consulta.lista) && podeAtualizarData(campos, consulta.lista);
  const selecao = useSelecaoLeads(chaveDaSelecao(consulta, periodo), FORECAST.MAX_IDS);

  const ehGestao = PAPEIS_GESTAO.includes(user?.role);

  function atualizar(mudancas) {
    setSearchParams((atuais) => escreverConsulta(atuais, mudancas));
  }

  function mudarPeriodo(proximo) {
    const erros = validarPeriodo(proximo.de, proximo.ate);

    if (proximo.de && proximo.ate && Object.keys(erros).length === 0) {
      setRascunho(null);
      atualizar({ de: proximo.de, ate: proximo.ate });

      return;
    }

    setRascunho({ ...proximo, erros });
  }

  function abrirMes(mes) {
    const aberta = consulta.lista && 'mes' in consulta.lista && consulta.lista.mes === mes;

    if (aberta) {
      atualizar({ lista: null });

      return;
    }

    const tipos = tiposDaLista(mes, resposta.hoje);

    // Mês atual: abre em "Em aberto", que é onde há o que fazer.
    atualizar({
      lista: { mes, tipo: tipos.includes(TIPOS_MES.ABERTO) ? TIPOS_MES.ABERTO : tipos[0] },
    });
  }

  function abrirBloco(bloco) {
    const aberto = consulta.lista && 'bloco' in consulta.lista && consulta.lista.bloco === bloco;

    atualizar({ lista: aberto ? null : { bloco } });
  }

  if (isAccessError(forecastQuery.error)) {
    return <AcessoIndisponivel error={forecastQuery.error} />;
  }

  const erroDeFiltro = forecastQuery.error ? erroDoForecast(forecastQuery.error) : null;
  const periodoNaTela = rascunho ?? {
    de: consulta.de ?? periodo?.de ?? '',
    ate: consulta.ate ?? periodo?.ate ?? '',
  };
  const errosDoPeriodo = { ...(rascunho?.erros ?? errosDaUrl) };

  if (
    erroDeFiltro?.tipo === 'filtro' &&
    (erroDeFiltro.campo === 'de' || erroDeFiltro.campo === 'ate')
  ) {
    errosDoPeriodo[erroDeFiltro.campo] ??= erroDeFiltro.mensagem;
  }

  const filtros = (
    <FiltrosForecast
      agrupar={consulta.agrupar}
      ate={periodoNaTela.ate}
      de={periodoNaTela.de}
      erros={errosDoPeriodo}
      onAgrupar={(agrupar) => atualizar({ agrupar })}
      onPeriodo={mudarPeriodo}
      onPipeline={(id) => atualizar({ pipelineId: id || null })}
      onResponsavel={(id) => atualizar({ responsavelId: id || null })}
      opcoesAgrupar={opcoesDeAgrupar({
        pipelineId: consulta.pipelineId,
        veStatus: veCampoStatus(campos),
      })}
      pipelineId={consulta.pipelineId ?? ''}
      pipelines={pipelinesDoForecast(pipelinesQuery.data ?? [], user?.role)}
      responsavelId={consulta.responsavelId ?? ''}
      usuarios={usuarios.map((usuario) => ({ valor: usuario.id, rotulo: usuario.nome }))}
    />
  );

  return (
    <>
      <div className="grid gap-6">
        {filtros}

        {erroDeFiltro?.tipo === 'pipeline' && (
          <div
            className="flex flex-wrap items-center justify-between gap-3 border border-border px-4 py-3 text-sm"
            role="alert"
          >
            <span>{erroDeFiltro.mensagem}</span>
            <Button onClick={() => atualizar({ pipelineId: null })} variant="outline">
              Tirar o filtro
            </Button>
          </div>
        )}
        {erroDeFiltro?.tipo === 'filtro' &&
          erroDeFiltro.campo !== 'de' &&
          erroDeFiltro.campo !== 'ate' && (
            <p className="text-sm text-destructive" role="alert">
              {erroDeFiltro.mensagem}
            </p>
          )}
        {forecastQuery.error && !erroDeFiltro && (
          <ApiErrorAlert error={forecastQuery.error} title="Não foi possível carregar o forecast" />
        )}

        {!resposta && forecastQuery.isPending && <MetricsSkeleton label="Carregando o forecast…" />}

        {resposta && (
          <ConteudoDoForecast
            comAcao={comAcao}
            consulta={consulta}
            ehGestao={ehGestao}
            linkDoLead={(item) => ({
              pathname: `${ROTAS_CRM.FORECAST}/leads/${encodeURIComponent(item.leadId)}`,
              search,
            })}
            listaQuery={listaQuery}
            nomePorId={nomePorId}
            onAba={(tipo) => atualizar({ lista: { mes: consulta.lista.mes, tipo } })}
            onAbrirBloco={abrirBloco}
            onAbrirMes={abrirMes}
            onAtualizarData={() => setDialogAberto(true)}
            onCriar={() => navigate(ROTAS_CRM.NOVO_LEAD)}
            onFecharLista={() => atualizar({ lista: null })}
            onPagina={(mudancas) => atualizar(mudancas)}
            resposta={resposta}
            selecao={selecao}
          />
        )}
      </div>

      <AtualizarDataDialog
        onConcluido={() => selecao.limpar()}
        onOpenChange={setDialogAberto}
        open={dialogAberto}
        selecionados={selecao.leads}
      />
    </>
  );
}

/** Gráfico, blocos, grupos e a lista aberta, a partir de uma resposta já carregada. */
function ConteudoDoForecast({
  resposta,
  consulta,
  ehGestao,
  listaQuery,
  nomePorId,
  linkDoLead,
  comAcao,
  selecao,
  onAbrirMes,
  onAbrirBloco,
  onAba,
  onPagina,
  onFecharLista,
  onAtualizarData,
  onCriar,
}) {
  const aviso = (
    <AvisoCamposDesligados chaves={resposta.camposDesligados ?? SEM_ITENS} ehGestao={ehGestao} />
  );

  if (resposta.vazio) {
    return (
      <>
        {aviso}
        <ForecastVazio onCriar={onCriar} />
      </>
    );
  }

  const { lista } = consulta;
  const mesAberto = lista && 'mes' in lista ? lista.mes : null;
  const blocoAberto = lista && 'bloco' in lista ? lista.bloco : null;
  const tipos = mesAberto ? tiposDaLista(mesAberto, resposta.hoje) : SEM_ITENS;
  const abas =
    tipos.length > 1
      ? tipos.map((tipo) => ({ valor: tipo, rotulo: ROTULOS_TIPO_MES[tipo] }))
      : null;
  const itens = listaQuery.data?.itens ?? SEM_ITENS;

  return (
    <>
      {aviso}

      {semResultado(resposta) && (
        <p className="text-sm text-muted-foreground" role="status">
          {TEXTOS_FORECAST.semResultado}
        </p>
      )}

      <GraficoForecast
        mesAberto={mesAberto}
        onAbrirMes={onAbrirMes}
        serie={serieDoGrafico(resposta.meses, { veValor: resposta.veValor, hoje: resposta.hoje })}
      />

      <CardsBlocos
        blocoAberto={blocoAberto}
        cards={cardsDosBlocos(resposta.blocos, resposta.veValor)}
        onAbrirBloco={onAbrirBloco}
      />

      {lista && (
        <ListaDoForecast
          abaAtual={mesAberto ? lista.tipo : undefined}
          abas={abas}
          acoes={
            comAcao ? (
              <>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {contadorSelecao(selecao.leads.length, FORECAST.MAX_IDS)}
                </span>
                <Button disabled={selecao.leads.length === 0} onClick={onAtualizarData}>
                  {TEXTOS_FORECAST.atualizarData}
                </Button>
              </>
            ) : null
          }
          carregando={listaQuery.isPending}
          erro={listaQuery.error}
          onAba={onAba}
          onFechar={onFecharLista}
          onPagina={onPagina}
          pagina={consulta.pagina}
          tamanho={consulta.tamanho}
          titulo={tituloDaLista(lista, Boolean(abas))}
          total={listaQuery.data?.total ?? 0}
        >
          <TabelaForecast
            colunas={colunasDaLista(itens)}
            itens={itens}
            linkDoLead={linkDoLead}
            nomePorId={nomePorId}
            selecao={comAcao ? selecao.tabela : null}
          />
        </ListaDoForecast>
      )}

      <GruposForecast
        agrupar={consulta.agrupar}
        linhas={linhasDosGrupos(resposta.grupos ?? SEM_ITENS, resposta.veValor)}
        meses={resposta.meses}
      />
    </>
  );
}
