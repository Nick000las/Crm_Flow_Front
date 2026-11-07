import { useCallback, useMemo, useState } from 'react';
import { lerPreferencia, salvarPreferencia } from '@/lib/preferencia-local';
import { sanearSelecao } from '../lib/colunas';

const PREFIXO_CHAVE = 'crm:colunas:';

/**
 * Colunas escolhidas na tabela. Fica em `localStorage` por tenant porque é
 * conveniência de quem está vendo, não dado do CRM.
 *
 * @param {string | undefined} tenantId
 * @param {import('../lib/colunas').Coluna[]} colunas todas as exibíveis
 * @param {readonly string[]} [padrao] colunas do layout do tenant, para quem ainda não escolheu
 */
export function useColunasVisiveis(tenantId, colunas, padrao) {
  const chave = `${PREFIXO_CHAVE}${tenantId ?? 'anonimo'}`;
  const [escolha, setEscolha] = useState(() => lerPreferencia(chave));

  // Saneia na leitura: um campo desligado depois de salvo some sem quebrar.
  const ids = useMemo(() => sanearSelecao(escolha, colunas, padrao), [escolha, colunas, padrao]);
  const visiveis = useMemo(
    () => colunas.filter((coluna) => ids.includes(coluna.id)),
    [colunas, ids],
  );

  const alternar = useCallback(
    (id) => {
      const proximos = ids.includes(id) ? ids.filter((atual) => atual !== id) : [...ids, id];

      // A tabela nunca fica sem coluna.
      if (proximos.length === 0) {
        return;
      }

      setEscolha(proximos);
      salvarPreferencia(chave, proximos);
    },
    [chave, ids],
  );

  return { ids, visiveis, alternar };
}
