import { useState } from 'react';

const MAXIMO = 2;
const VAZIA = Object.freeze({ chave: null, leads: Object.freeze([]) });

/**
 * Seleção de até 2 leads na tabela, para mesclar. Vale só para a consulta
 * em que foi feita (`chaveDaConsulta`): trocar busca, filtro, situação ou
 * página a zera, sem efeito colateral.
 *
 * @param {string} chaveDaConsulta
 */
export function useSelecaoMesclagem(chaveDaConsulta) {
  const [selecao, setSelecao] = useState(VAZIA);
  const leads = selecao.chave === chaveDaConsulta ? selecao.leads : VAZIA.leads;
  const ids = new Set(leads.map((lead) => lead.id));

  function alternar(lead) {
    const proximos = ids.has(lead.id)
      ? leads.filter((atual) => atual.id !== lead.id)
      : leads.length < MAXIMO
        ? [...leads, lead]
        : leads;
    setSelecao({ chave: chaveDaConsulta, leads: proximos });
  }

  return {
    leads,
    tabela: { ids, cheia: leads.length >= MAXIMO, alternar },
    completa: leads.length === MAXIMO,
    limpar: () => setSelecao(VAZIA),
  };
}
