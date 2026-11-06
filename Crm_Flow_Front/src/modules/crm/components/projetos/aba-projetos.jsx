import { Link } from 'react-router-dom';
import { formatarInstante } from '../../lib/formatadores';

/**
 * Aba "Projetos" do drawer: os cards do Kanban ligados ao lead. Só leitura;
 * o link leva ao quadro.
 *
 * @param {{ projetos: import('../../api/projetos.api').ProjetoDoLead[] }} props
 */
export function AbaProjetos({ projetos }) {
  return (
    <ul>
      {projetos.map((projeto) => (
        <li
          className="grid gap-0.5 border-b border-border py-3 last:border-b-0"
          key={projeto.cardId}
        >
          <Link
            className="w-fit text-sm font-medium break-words underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
            to={`/kanban?quadro=${encodeURIComponent(projeto.boardId)}`}
          >
            {projeto.titulo}
          </Link>
          <p className="text-sm text-muted-foreground">
            {projeto.boardNome} · {projeto.colunaNome}
          </p>
          <time
            className="font-mono text-xs text-muted-foreground tabular-nums"
            dateTime={projeto.updatedAt}
          >
            {formatarInstante(projeto.updatedAt)}
          </time>
        </li>
      ))}
    </ul>
  );
}
