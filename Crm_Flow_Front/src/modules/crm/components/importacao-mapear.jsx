import { TriangleAlert } from 'lucide-react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getFieldError } from '@/services/api';
import { ESTRATEGIAS_DUPLICATA, ROTULOS_ESTRATEGIA } from '../constants';
import { problemasDoMapeamento } from '../lib/importacao';
import { SelectSimples } from './select-simples';

const HEAD_CLASS = 'font-mono text-[11px] font-normal uppercase tracking-wide text-muted-foreground';
const AMOSTRAS = 3;
const NAO_IMPORTAR = 'Não importar';

function textoDaAmostra(valor) {
  if (valor === null || valor === undefined || valor === '') return '—';
  return String(valor);
}

function Avisos({ problemas }) {
  if (problemas.length === 0) return null;

  return (
    <div className="flex gap-2 border border-border p-3 text-sm" role="status">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <ul className="grid gap-0.5">
        {problemas.map((problema) => (
          <li key={problema}>{problema}</li>
        ))}
      </ul>
    </div>
  );
}

function Estrategia({ valor, onChange }) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 text-sm font-medium">Quando o lead já existir (mesmo e-mail ou telefone)</legend>
      {ESTRATEGIAS_DUPLICATA.map((estrategia) => {
        const { rotulo, descricao } = ROTULOS_ESTRATEGIA[estrategia];
        const id = `estrategia-${estrategia}`;

        return (
          <label className="flex cursor-pointer items-start gap-2 border border-border p-3 text-sm has-checked:border-foreground" htmlFor={id} key={estrategia}>
            <input
              checked={valor === estrategia}
              className="mt-0.5 accent-foreground"
              id={id}
              name="estrategia-duplicata"
              onChange={() => onChange(estrategia)}
              type="radio"
            />
            <span>
              <span className="font-medium">{rotulo}</span>
              <span className="block text-muted-foreground">{descricao}</span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

/**
 * Passo 2: para cada coluna da planilha, o campo do CRM que a recebe.
 * Avisos no cliente espelham o back; a validação de verdade é o passo 3.
 *
 * @param {{
 *   preview: { colunas: string[], totalLinhas: number, linhas: Record<string, unknown>[], campos: object[] },
 *   nomeArquivo: string,
 *   mapeamento: Record<string, string>,
 *   estrategia: string,
 *   validacao: import('@tanstack/react-query').UseMutationResult,
 *   onMapear: (coluna: string, chave: string) => void,
 *   onEstrategia: (estrategia: string) => void,
 *   onValidar: () => void,
 *   onTrocarArquivo: () => void,
 * }} props
 */
export function ImportacaoMapear({
  preview,
  nomeArquivo,
  mapeamento,
  estrategia,
  validacao,
  onMapear,
  onEstrategia,
  onValidar,
  onTrocarArquivo,
}) {
  const opcoes = preview.campos.map((campo) => ({ valor: campo.chave, rotulo: campo.label }));
  const problemas = problemasDoMapeamento(mapeamento, preview.campos);
  // O back devolve os problemas de mapeamento como lista em `fields.mapeamento`.
  const problemasDoBack = validacao.error ? (validacao.error.fields?.mapeamento ?? []) : [];

  return (
    <div className="grid gap-6">
      <p className="text-sm text-muted-foreground">
        <span className="font-mono text-foreground">{nomeArquivo}</span> ·{' '}
        <span className="font-mono tabular-nums">{preview.totalLinhas.toLocaleString('pt-BR')}</span> linhas
      </p>

      <div className="overflow-x-auto border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={HEAD_CLASS} scope="col">Coluna da planilha</TableHead>
              <TableHead className={HEAD_CLASS} scope="col">Campo do CRM</TableHead>
              <TableHead className={HEAD_CLASS} scope="col">Amostras</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {preview.colunas.map((coluna) => (
              <TableRow key={coluna}>
                <TableCell className="font-medium">{coluna}</TableCell>
                <TableCell className="min-w-48">
                  <SelectSimples
                    aria-label={`Campo do CRM para a coluna ${coluna}`}
                    onChange={(chave) => onMapear(coluna, chave)}
                    opcoes={opcoes}
                    vazio={NAO_IMPORTAR}
                    value={mapeamento[coluna] ?? ''}
                  />
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {preview.linhas.slice(0, AMOSTRAS).map((linha, indice) => (
                    <span className="block max-w-56 truncate" key={indice}>
                      {textoDaAmostra(linha[coluna])}
                    </span>
                  ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Avisos problemas={problemasDoBack.length > 0 ? problemasDoBack : problemas} />
      {validacao.error && !getFieldError(validacao.error, 'mapeamento') && (
        <ApiErrorAlert error={validacao.error} id="importacao-validar-erro" title="Não foi possível validar" />
      )}

      <Estrategia onChange={onEstrategia} valor={estrategia} />

      <div className="flex flex-wrap gap-2">
        <Button disabled={validacao.isPending} onClick={onTrocarArquivo} variant="outline">
          Trocar arquivo
        </Button>
        <Button
          aria-busy={validacao.isPending}
          disabled={problemas.length > 0 || validacao.isPending}
          onClick={onValidar}
        >
          {validacao.isPending ? 'Validando…' : 'Validar planilha'}
        </Button>
      </div>
    </div>
  );
}
