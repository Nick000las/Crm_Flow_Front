import { ListChecks } from 'lucide-react';
import { ModulePlaceholder } from '@/components/module-placeholder';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { temCategoria } from '../../lib/listas';
import { moverPara } from '../../lib/ordem';
import { ListaOrdenavel } from '../ordenavel/lista-ordenavel';
import { LinhaOpcao } from './linha-opcao';

const HEAD_CLASS =
  'font-mono text-[11px] font-normal uppercase tracking-wide text-muted-foreground';

/**
 * Opções de uma lista, na ordem dos seletores, com arrastar e ↑/↓.
 *
 * @param {{
 *   tipo: string,
 *   opcoes: import('../../lib/listas').OpcaoConfigurada[],
 *   ordemOcupada: boolean,
 *   onReordenar: (ids: string[]) => void,
 *   onEditar: (opcao: import('../../lib/listas').OpcaoConfigurada) => void,
 *   onExcluir: (opcao: import('../../lib/listas').OpcaoConfigurada) => void,
 *   acaoVazio: import('react').ReactNode,
 * }} props
 */
export function TabelaOpcoes({
  tipo,
  opcoes,
  ordemOcupada,
  onReordenar,
  onEditar,
  onExcluir,
  acaoVazio,
}) {
  if (opcoes.length === 0) {
    return (
      <ModulePlaceholder
        description="As opções desta lista aparecem nos seletores do lead e nos filtros."
        icon={ListChecks}
        title="Nenhuma opção ainda"
      >
        {acaoVazio}
      </ModulePlaceholder>
    );
  }

  const ids = opcoes.map((opcao) => opcao.id);
  const rotuloDe = (id) => opcoes.find((opcao) => opcao.id === id)?.label ?? '';

  function mover(de, para) {
    const proximos = moverPara(ids, de, para);
    if (proximos !== ids) {
      onReordenar(proximos);
    }
  }

  return (
    <ListaOrdenavel ids={ids} onMover={mover} rotuloDe={rotuloDe}>
      <div aria-busy={ordemOcupada} className="overflow-x-auto border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">
                <span className="sr-only">Ordem</span>
              </TableHead>
              <TableHead className={HEAD_CLASS} scope="col">
                Opção
              </TableHead>
              {temCategoria(tipo) && (
                <TableHead className={HEAD_CLASS} scope="col">
                  Categoria
                </TableHead>
              )}
              <TableHead className={`${HEAD_CLASS} text-right`} scope="col">
                Leads
              </TableHead>
              <TableHead className={`${HEAD_CLASS} text-center`} scope="col">
                Ativa
              </TableHead>
              <TableHead scope="col">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {opcoes.map((opcao, indice) => (
              <LinhaOpcao
                indice={indice}
                key={opcao.id}
                onEditar={onEditar}
                onExcluir={onExcluir}
                onMover={mover}
                opcao={opcao}
                ordemOcupada={ordemOcupada}
                tipo={tipo}
                total={opcoes.length}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </ListaOrdenavel>
  );
}
