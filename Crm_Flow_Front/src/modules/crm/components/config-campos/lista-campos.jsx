/**
 * @file Matriz de campos com ordem por arrastar (`ListaOrdenavel`) e ↑/↓.
 */
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { ROTULOS_CONTEXTO } from '../../constants';
import { CONTEXTOS } from '../../lib/configuracoes-campos';
import { moverPara } from '../../lib/ordem';
import { ListaOrdenavel } from '../ordenavel/lista-ordenavel';
import { LinhaCampo } from './linha-campo';

/**
 * Matriz de campos com ordem por arrastar (`ListaOrdenavel`) e ↑/↓.
 *
 * @param {{
 *   campos: import('../../types').CampoConfigurado[],
 *   ordemOcupada: boolean,
 *   onReordenar: (ids: string[]) => void,
 *   onEditar: (campo: import('../../types').CampoConfigurado) => void,
 *   onExcluir: (campo: import('../../types').CampoConfigurado) => void,
 * }} props
 */
export function ListaCampos({ campos, ordemOcupada, onReordenar, onEditar, onExcluir }) {
  const ids = campos.map((campo) => campo.id);
  const rotuloDe = (id) => campos.find((campo) => campo.id === id)?.label ?? '';

  function mover(de, para) {
    const proximos = moverPara(ids, de, para);

    if (proximos !== ids) {
      onReordenar(proximos);
    }
  }

  return (
    <ListaOrdenavel ids={ids} onMover={mover} rotuloDe={rotuloDe}>
      <Card layout="plain" aria-busy={ordemOcupada} className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">
                <span className="sr-only">Ordem</span>
              </TableHead>
              <TableHead scope="col">Campo</TableHead>
              <TableHead scope="col">Tipo</TableHead>
              {CONTEXTOS.map((contexto) => (
                <TableHead className="text-center" key={contexto} scope="col">
                  {ROTULOS_CONTEXTO[contexto]}
                </TableHead>
              ))}
              <TableHead className="text-center" scope="col">
                Obrigatório
              </TableHead>
              <TableHead className="text-center" scope="col">
                Sensível
              </TableHead>
              <TableHead scope="col">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {campos.map((campo, indice) => (
              <LinhaCampo
                campo={campo}
                indice={indice}
                key={campo.id}
                onEditar={onEditar}
                onExcluir={onExcluir}
                onMover={mover}
                ordemOcupada={ordemOcupada}
                total={campos.length}
              />
            ))}
          </TableBody>
        </Table>
      </Card>
    </ListaOrdenavel>
  );
}
