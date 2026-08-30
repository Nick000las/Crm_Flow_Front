/**
 * @file Navegação entre a lista e o Sheet preservando a query string: abrir um lead e voltar
 * mantém busca, página e tamanho. Aberto sobre o quadro comercial, a rota-pai manda
 * `baseDoLead` pelo Outlet, e o Sheet volta para ela.
 */
import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';

import { ROTAS_CRM } from '../rotas';

/**
 * Navegação entre a lista e o Sheet preservando a query string: abrir um lead
 * e voltar mantém busca, página e tamanho. Aberto sobre o quadro comercial, a
 * rota-pai manda `baseDoLead` pelo Outlet, e o Sheet volta para ela.
 */
export function useNavegacaoLeads() {
  const navigate = useNavigate();
  const { search } = useLocation();

  const baseDoLead = useOutletContext()?.baseDoLead;

  const destinos = useMemo(
    () => ({
      lista: { pathname: baseDoLead ?? ROTAS_CRM.LISTA, search },
      novo: { pathname: ROTAS_CRM.NOVO_LEAD, search },
      lead: (id) => ({
        pathname: baseDoLead ? `${baseDoLead}/leads/${encodeURIComponent(id)}` : ROTAS_CRM.lead(id),
        search,
      }),
    }),
    [baseDoLead, search],
  );

  /**
   * @param {string} id
   * @param {{ editar?: boolean, aviso?: string }} [opcoes] `aviso` aparece na lista (`role="status"`)
   */
  const abrirLead = useCallback(
    (id, { editar = false, aviso } = {}) =>
      navigate(destinos.lead(id), { state: { editar, ...(aviso && { aviso }) } }),
    [destinos, navigate],
  );

  /** @param {string} [aviso] confirmação breve exibida na lista (`role="status"`) */
  const voltarParaLista = useCallback(
    (aviso) => navigate(destinos.lista, { state: aviso ? { aviso } : undefined }),
    [destinos, navigate],
  );

  return { destinos, abrirLead, voltarParaLista };
}
