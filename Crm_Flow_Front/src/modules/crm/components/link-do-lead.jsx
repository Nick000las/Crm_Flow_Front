import { Link } from 'react-router-dom';
import { useNavegacaoLeads } from '../hooks/use-navegacao-leads';
import { idLinkDoLead } from '../rotas';

/**
 * Link que abre o Sheet do lead, preservando busca e página. O `id` é o alvo
 * do foco quando o Sheet fecha.
 *
 * @param {{
 *   lead: { id: string, nome: string },
 *   titulo?: string,
 *   children: import('react').ReactNode,
 * }} props `titulo`: como o lead é chamado (identificador do layout); padrão, o nome
 */
export function LinkDoLead({ lead, titulo, children }) {
  const { destinos } = useNavegacaoLeads();

  return (
    <Link
      aria-label={`Abrir ${titulo ?? lead.nome}`}
      className="underline-offset-4 outline-none hover:underline focus-visible:underline focus-visible:ring-2 focus-visible:ring-ring/50"
      id={idLinkDoLead(lead.id)}
      to={destinos.lead(lead.id)}
    >
      {children}
    </Link>
  );
}
