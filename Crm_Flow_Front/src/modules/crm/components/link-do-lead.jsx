import { Link } from 'react-router-dom';
import { useNavegacaoLeads } from '../hooks/use-navegacao-leads';
import { idLinkDoLead } from '../rotas';

/**
 * Link que abre o Sheet do lead, preservando busca e página. O `id` é o alvo
 * do foco quando o Sheet fecha.
 *
 * @param {{ lead: { id: string, nome: string }, children: import('react').ReactNode }} props
 */
export function LinkDoLead({ lead, children }) {
  const { destinos } = useNavegacaoLeads();

  return (
    <Link
      aria-label={`Abrir ${lead.nome}`}
      className="underline-offset-4 outline-none hover:underline focus-visible:underline focus-visible:ring-2 focus-visible:ring-ring/50"
      id={idLinkDoLead(lead.id)}
      to={destinos.lead(lead.id)}
    >
      {children}
    </Link>
  );
}
