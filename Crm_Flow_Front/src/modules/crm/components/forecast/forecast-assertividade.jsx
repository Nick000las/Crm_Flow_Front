import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { LoadingState } from '@/components/loading-state';
import { useAssertividade } from '../../hooks/use-assertividade';
import {
  erroDaAssertividade,
  escreverConsultaAssertividade,
  lerConsultaAssertividade,
  mesPadraoDaLeitura,
  paramsDaAssertividade,
  todosSemDados,
  ultimoMesFechado,
  validarPeriodoFechado,
} from '../../lib/assertividade';
import { TEXTOS_ASSERTIVIDADE } from '../../lib/assertividade-textos';
import {
  linhasPorResponsavel,
  mesDaTabela,
  serieDaAssertividade,
} from '../../lib/assertividade-vista';
import { rotuloDoMes } from '../../lib/forecast-textos';
import { AssertividadeVazia } from './assertividade/assertividade-vazia';
import { FiltroAssertividade } from './assertividade/filtro-assertividade';
import { GraficoAssertividade } from './assertividade/grafico-assertividade';
import { LeituraAssertividade } from './assertividade/leitura-assertividade';
import { TabelaPorResponsavel } from './assertividade/tabela-por-responsavel';

const SEM_MESES = [];
// Teto que nenhum `AAAA-MM` passa: valida a URL sem a regra dos meses fechados.
const SEM_LIMITE = '9999-12';

const maiuscula = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

/**
 * Aba Assertividade do Forecast (FC3, só gestão): o que o primeiro snapshot
 * de cada mês fechado previa e o que se realizou. Período e mês aberto moram
 * na URL (`lib/assertividade.js`); a % vem da razão da API (`porcentagem`),
 * nada é recalculado. O 403 `FORBIDDEN` chama `onOculta`, sem erro cru.
 *
 * @param {{ onOculta: () => void }} props
 */
export function ForecastAssertividade({ onOculta }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const consulta = lerConsultaAssertividade(searchParams);
  // Período sendo digitado: só vai para a URL quando é válido.
  const [rascunho, setRascunho] = useState(null);

  // A URL é validada só pelo formato e pelo tamanho; o "só meses fechados" fica
  // para a tela e para o 400 do back, porque o fuso só chega com a resposta.
  const errosDaUrl = validarPeriodoFechado(consulta.de, consulta.ate, SEM_LIMITE);
  const urlValida = Object.keys(errosDaUrl).length === 0;

  const query = useAssertividade(
    paramsDaAssertividade(urlValida ? consulta : { ...consulta, de: null, ate: null }),
  );
  const resposta = query.data;
  const ultimoFechado = ultimoMesFechado(resposta?.fuso);
  const erro = query.error ? erroDaAssertividade(query.error) : null;
  const oculta = erro?.tipo === 'oculta';

  useEffect(() => {
    if (oculta) {
      onOculta();
    }
  }, [oculta, onOculta]);

  function atualizar(mudancas) {
    setSearchParams((atuais) => escreverConsultaAssertividade(atuais, mudancas));
  }

  function mudarPeriodo(proximo) {
    const erros = validarPeriodoFechado(proximo.de, proximo.ate, ultimoFechado);
    if (proximo.de && proximo.ate && Object.keys(erros).length === 0) {
      setRascunho(null);
      atualizar({ de: proximo.de, ate: proximo.ate });
      return;
    }
    setRascunho({ ...proximo, erros });
  }

  if (oculta) {
    return null;
  }

  const periodoNaTela = rascunho ?? {
    de: consulta.de ?? resposta?.periodo?.de ?? '',
    ate: consulta.ate ?? resposta?.periodo?.ate ?? '',
  };
  const erros = { ...(rascunho?.erros ?? errosDaUrl) };
  if (erro?.tipo === 'filtro') {
    erros[erro.campo] ??= erro.mensagem;
  }

  const meses = resposta?.meses ?? SEM_MESES;
  const mesAberto = consulta.mes;
  const mesDaLeitura = mesDaTabela(meses, mesAberto ?? mesPadraoDaLeitura(meses));
  const mesAbertoDados = mesDaTabela(meses, mesAberto);

  return (
    <div className="grid gap-6">
      <FiltroAssertividade
        ate={periodoNaTela.ate}
        de={periodoNaTela.de}
        erros={erros}
        max={ultimoFechado}
        onPeriodo={mudarPeriodo}
      />

      {query.error && !erro && (
        <ApiErrorAlert error={query.error} title="Não foi possível carregar a assertividade" />
      )}
      {!resposta && query.isPending && <LoadingState label="Carregando a assertividade…" />}

      {resposta && (
        <>
          {todosSemDados(meses) && <AssertividadeVazia />}

          <GraficoAssertividade
            mesAberto={mesAberto}
            onAbrirMes={(mes) => atualizar({ mes: mes === mesAberto ? null : mes })}
            pontos={serieDaAssertividade(meses, mesAberto).pontos}
          />

          <LeituraAssertividade mes={mesDaLeitura} />

          {mesAbertoDados ? (
            <TabelaPorResponsavel
              linhas={linhasPorResponsavel(mesAbertoDados)}
              titulo={`Por responsável · ${maiuscula(rotuloDoMes(mesAbertoDados.mes))}`}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{TEXTOS_ASSERTIVIDADE.escolhaUmMes}</p>
          )}
        </>
      )}
    </div>
  );
}
