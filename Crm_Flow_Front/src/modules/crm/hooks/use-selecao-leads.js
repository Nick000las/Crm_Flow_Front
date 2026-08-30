import { useState } from 'react';

const VAZIA = Object.freeze({ chave: null, leads: Object.freeze([]) });

/**
 * Leads marcados na tabela: até 2 para mesclar ou até `BULK.MAX_IDS` para a
 * edição em massa (`crm.massa`). Vale só para a consulta em que foi feita
 * (`chaveDaConsulta`): trocar busca, filtro, situação ou página a zera, sem
 * efeito colateral.
 *
 * @param {string} chaveDaConsulta
 * @param {number} maximo
 */
export function useSelecaoLeads(chaveDaConsulta, maximo) {
  const [selecao, setSelecao] = useState(VAZIA);
  const leads = selecao.chave === chaveDaConsulta ? selecao.leads : VAZIA.leads;
  const ids = new Set(leads.map((lead) => lead.id));
  const definir = (proximos) => setSelecao({ chave: chaveDaConsulta, leads: proximos });

  function alternar(lead) {
    if (ids.has(lead.id)) {
      definir(leads.filter((atual) => atual.id !== lead.id));
    } else if (leads.length < maximo) {
      definir([...leads, lead]);
    }
  }

  /** Cabeçalho: com todos da página marcados desmarca; senão, completa até o máximo. */
  function alternarPagina(daPagina) {
    const todos = daPagina.length > 0 && daPagina.every((lead) => ids.has(lead.id));
    if (todos) {
      const daPaginaIds = new Set(daPagina.map((lead) => lead.id));
      definir(leads.filter((lead) => !daPaginaIds.has(lead.id)));
      return;
    }

    const faltando = daPagina.filter((lead) => !ids.has(lead.id));
    definir([...leads, ...faltando].slice(0, maximo));
  }

  /** Depois da edição em massa: só as falhas continuam marcadas. */
  function manter(idsParaManter) {
    const manterIds = new Set(idsParaManter);
    definir(leads.filter((lead) => manterIds.has(lead.id)));
  }

  return {
    leads,
    tabela: { ids, cheia: leads.length >= maximo, alternar, alternarPagina, emMassa: maximo > 2 },
    limpar: () => setSelecao(VAZIA),
    manter,
  };
}
