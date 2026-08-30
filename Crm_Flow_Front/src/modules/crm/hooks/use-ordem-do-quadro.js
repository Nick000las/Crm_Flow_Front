/**
 * @file Ordem escolhida, por tenant e por quadro. Fica no `localStorage` porque é conveniência
 * de quem está vendo. O filtro não: ele mora na URL.
 */
import { useCallback, useMemo, useState } from 'react';

import { lerPreferencia, salvarPreferencia } from '@/lib/preferencia-local';

import { ordemValida } from '../lib/quadro-consulta';

const PREFIXO_CHAVE = 'crm:quadro-ordem:';

/**
 * Ordem escolhida, por tenant e por quadro. Fica no `localStorage` porque é
 * conveniência de quem está vendo. O filtro não: ele mora na URL.
 *
 * @param {string | undefined} tenantId
 * @param {string} quadroRef
 * @param {{ chave: string }[]} campos todos os de `/fields`
 */
export function useOrdemDoQuadro(tenantId, quadroRef, campos) {
  const chave = `${PREFIXO_CHAVE}${tenantId ?? 'anonimo'}:${quadroRef}`;
  const [escolha, setEscolha] = useState(() => lerPreferencia(chave));

  // Saneia na leitura: um campo que o papel deixou de ver não vira 400.
  const ordem = useMemo(() => ordemValida(escolha, campos), [escolha, campos]);

  /** @param {import('../lib/quadro-consulta').OrdemDoQuadro} proxima */
  const escolher = useCallback(
    (proxima) => {
      setEscolha(proxima);
      salvarPreferencia(chave, proxima);
    },
    [chave],
  );

  return { ordem, escolher };
}
