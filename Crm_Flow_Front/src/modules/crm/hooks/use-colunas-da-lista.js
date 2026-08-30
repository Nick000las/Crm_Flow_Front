/**
 * @file Colunas da lista de leads: as do contexto "Tabela", a escolha salva do usuário e, com
 * layout (`crm.layout`), o identificador fixo na 1ª coluna (fora do seletor) e as colunas
 * padrão do layout para quem ainda não escolheu.
 */
import { useMemo } from 'react';

import { CONTEXTO } from '../constants';
import { comDataConversao } from '../lib/ciclo-de-vida';
import { montarColunas } from '../lib/colunas';
import { camposDoContexto } from '../lib/contextos';
import { idsDasColunas } from '../lib/layout';
import { useColunasVisiveis } from './use-colunas-visiveis';
import { useLayoutEfetivo } from './use-layout';

/**
 * Colunas da lista de leads: as do contexto "Tabela", a escolha salva do
 * usuário e, com layout (`crm.layout`), o identificador fixo na 1ª coluna
 * (fora do seletor) e as colunas padrão do layout para quem ainda não
 * escolheu.
 *
 * @param {import('../types').Campo[]} campos todos os de `/fields`
 * @param {string | undefined} tenantId
 */
export function useColunasDaLista(campos, tenantId) {
  const layout = useLayoutEfetivo();
  const identificador = layout?.identificador ?? null;

  const colunas = useMemo(
    () =>
      // O gate olha todos os de `/fields`: "Data de conversão" pode estar fora da tabela.
      montarColunas(camposDoContexto(campos, CONTEXTO.TABELA), {
        comDataConversao: comDataConversao(campos),
      }).filter((coluna) => coluna.id !== identificador?.chave),
    [campos, identificador],
  );
  const colunasPadrao = useMemo(
    () => (layout ? idsDasColunas(layout.colunas) : undefined),
    [layout],
  );
  const selecao = useColunasVisiveis(tenantId, colunas, colunasPadrao);

  return { identificador, colunas, ...selecao };
}
