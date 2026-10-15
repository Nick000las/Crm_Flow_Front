import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROTAS_CRM } from '../rotas';

/**
 * Navegação entre a lista e o Sheet preservando a query string: abrir um lead
 * e voltar mantém busca, página e tamanho.
 */
export function useNavegacaoLeads() {
  const navigate = useNavigate();
  const { search } = useLocation();

  const destinos = useMemo(
    () => ({
      lista: { pathname: ROTAS_CRM.LISTA, search },
      novo: { pathname: ROTAS_CRM.NOVO_LEAD, search },
      lead: (id) => ({ pathname: ROTAS_CRM.lead(id), search }),
    }),
    [search],
  );

  /** @param {string} id @param {{ editar?: boolean }} [opcoes] */
  const abrirLead = useCallback(
    (id, { editar = false } = {}) => navigate(destinos.lead(id), { state: { editar } }),
    [destinos, navigate],
  );

  /** @param {string} [aviso] confirmação breve exibida na lista (`role="status"`) */
  const voltarParaLista = useCallback(
    (aviso) => navigate(destinos.lista, { state: aviso ? { aviso } : undefined }),
    [destinos, navigate],
  );

  return { destinos, abrirLead, voltarParaLista };
}
