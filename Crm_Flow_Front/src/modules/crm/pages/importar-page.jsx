import { useReducer } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/page-header';
import { ImportacaoArquivo } from '../components/importacao-arquivo';
import { ImportacaoMapear } from '../components/importacao-mapear';
import { ImportacaoPassos } from '../components/importacao-passos';
import { ImportacaoProcessar } from '../components/importacao-processar';
import { ImportacaoRevisar } from '../components/importacao-revisar';
import { useConfirmarImportacao, useValidarImportacao } from '../hooks/use-importacao';
import { PASSO, estadoInicial, mapeamentoParaEnvio, wizardReducer } from '../lib/importacao';

const PARAM_JOB = 'job';

/**
 * Import de planilha em 4 passos. O estado do wizard é uma máquina de
 * passos explícita (`wizardReducer`); só o `jobId` vai para a URL, para o
 * acompanhamento sobreviver a um F5 — a planilha em si não sobrevive, e
 * nem precisa: depois de confirmar, o back já tem tudo.
 */
export default function ImportarPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [estado, dispatch] = useReducer(wizardReducer, searchParams.get(PARAM_JOB), estadoInicial);
  const validar = useValidarImportacao();
  const confirmar = useConfirmarImportacao();

  function reiniciar() {
    validar.reset();
    confirmar.reset();
    setSearchParams({}, { replace: true });
    dispatch({ tipo: 'reiniciar' });
  }

  function handleValidar() {
    validar.mutate(
      {
        arquivo: estado.arquivo,
        mapeamento: mapeamentoParaEnvio(estado.mapeamento),
        estrategiaDuplicata: estado.estrategia,
        baseLegalLote: estado.baseLegalLote,
      },
      { onSuccess: (validacao) => dispatch({ tipo: 'validado', validacao }) },
    );
  }

  /** @param {Record<string, string> | null} acoes por linha duplicada */
  function handleConfirmar(acoes) {
    const { jobId } = estado.validacao;

    confirmar.mutate(
      { jobId, acoes },
      {
        onSuccess: () => {
          setSearchParams({ [PARAM_JOB]: jobId }, { replace: true });
          dispatch({ tipo: 'confirmado' });
        },
      },
    );
  }

  return (
    <>
      <PageHeader title="Importar" description="Traga leads de uma planilha .xlsx." />
      <ImportacaoPassos atual={estado.passo} />

      {estado.passo === PASSO.ARQUIVO && (
        <ImportacaoArquivo
          onLido={(arquivo, preview) => dispatch({ tipo: 'arquivoLido', arquivo, preview })}
        />
      )}

      {estado.passo === PASSO.MAPEAR && (
        <ImportacaoMapear
          baseLegalLote={estado.baseLegalLote}
          estrategia={estado.estrategia}
          mapeamento={estado.mapeamento}
          nomeArquivo={estado.arquivo.name}
          onBaseLegalLote={(baseLegalLote) => {
            validar.reset();
            dispatch({ tipo: 'baseLegalLote', baseLegalLote });
          }}
          onEstrategia={(estrategia) => {
            validar.reset();
            dispatch({ tipo: 'estrategia', estrategia });
          }}
          onMapear={(coluna, chave) => {
            validar.reset();
            dispatch({ tipo: 'mapear', coluna, chave });
          }}
          onTrocarArquivo={reiniciar}
          onValidar={handleValidar}
          preview={estado.preview}
          validacao={validar}
        />
      )}

      {estado.passo === PASSO.REVISAR && (
        <ImportacaoRevisar
          baseLegalLote={estado.baseLegalLote}
          confirmacao={confirmar}
          estrategia={estado.estrategia}
          onConfirmar={handleConfirmar}
          onVoltar={() => {
            confirmar.reset();
            dispatch({ tipo: 'voltar' });
          }}
          validacao={estado.validacao}
        />
      )}

      {estado.passo === PASSO.PROCESSAR && (
        <ImportacaoProcessar jobId={estado.jobId} onNovaImportacao={reiniciar} />
      )}
    </>
  );
}
