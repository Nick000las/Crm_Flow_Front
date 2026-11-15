import { ClipboardList, Plus } from 'lucide-react';
import { useState } from 'react';
import { AcessoIndisponivel } from '@/components/acesso-indisponivel';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { ModulePlaceholder } from '@/components/module-placeholder';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { isAccessError } from '@/services/api';
import { useFormularios } from '../../hooks/use-formularios';
import { formatarInstante } from '../../lib/formatadores';
import {
  LIMITE_FORMULARIOS,
  MENSAGENS_FORMULARIO,
  situacaoDoFormulario,
} from '../../lib/formularios';
import { ControleTravado } from '../controle-travado';
import { FormularioDialog } from './formulario-dialog';

const HEAD_CLASS =
  'font-mono text-[11px] font-normal uppercase tracking-wide text-muted-foreground';

function Carregando() {
  return (
    <div className="grid gap-2" aria-busy="true">
      <span className="sr-only" role="status">
        Carregando formulários…
      </span>
      {Array.from({ length: 3 }, (_, indice) => (
        <Skeleton className="h-11 rounded-none" key={indice} />
      ))}
    </div>
  );
}

function Situacao({ formulario }) {
  const { rotulo, versao } = situacaoDoFormulario(formulario);

  return (
    <span className="text-sm whitespace-nowrap">
      {rotulo}
      {versao !== null && (
        <span className="ml-1.5 font-mono text-xs text-muted-foreground">v{versao}</span>
      )}
    </span>
  );
}

/**
 * @param {{ onAbrir: (id: string, aviso?: string) => void }} props
 */
export function ListaFormularios({ onAbrir }) {
  const formulariosQuery = useFormularios();
  const [criando, setCriando] = useState(false);

  if (isAccessError(formulariosQuery.error)) {
    return <AcessoIndisponivel error={formulariosQuery.error} />;
  }
  if (formulariosQuery.error) {
    return <ApiErrorAlert error={formulariosQuery.error} id="config-formularios-carregar-erro" />;
  }
  if (formulariosQuery.isPending) {
    return <Carregando />;
  }

  const formularios = formulariosQuery.data;
  const motivoNovo = formularios.length >= LIMITE_FORMULARIOS ? MENSAGENS_FORMULARIO.LIMITE : null;
  const botaoNovo = (
    <ControleTravado motivo={motivoNovo} motivoId="formulario-novo-motivo">
      <Button
        aria-describedby={motivoNovo ? 'formulario-novo-motivo' : undefined}
        className={motivoNovo ? 'pointer-events-none rounded-none' : 'rounded-none'}
        disabled={Boolean(motivoNovo)}
        onClick={() => setCriando(true)}
        type="button"
      >
        <Plus aria-hidden="true" />
        Novo formulário
      </Button>
    </ControleTravado>
  );

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Um formulário escolhe campos da pessoa que o CRM já tem, e a resposta grava neles. Para
          uma pergunta nova, crie antes um campo personalizado em Campos.
        </p>
        {formularios.length > 0 && botaoNovo}
      </div>

      {formularios.length === 0 ? (
        <ModulePlaceholder
          description="Monte o primeiro com os campos que a pessoa deve responder."
          icon={ClipboardList}
          title="Nenhum formulário ainda"
        >
          {botaoNovo}
        </ModulePlaceholder>
      ) : (
        <div className="overflow-x-auto border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={HEAD_CLASS} scope="col">
                  Formulário
                </TableHead>
                <TableHead className={HEAD_CLASS} scope="col">
                  Situação
                </TableHead>
                <TableHead className={HEAD_CLASS} scope="col">
                  Ativo
                </TableHead>
                <TableHead className={HEAD_CLASS} scope="col">
                  Validade do link
                </TableHead>
                <TableHead className={HEAD_CLASS} scope="col">
                  Atualizado em
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formularios.map((formulario) => (
                <TableRow key={formulario.id}>
                  <TableCell className="min-w-48">
                    <button
                      className="text-left font-medium underline-offset-4 outline-none hover:underline focus-visible:underline focus-visible:ring-2 focus-visible:ring-ring/50"
                      onClick={() => onAbrir(formulario.id)}
                      type="button"
                    >
                      {formulario.nome}
                    </button>
                    {formulario.descricao && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {formulario.descricao}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Situacao formulario={formulario} />
                  </TableCell>
                  <TableCell className="text-sm">
                    {formulario.ativo ? 'Ativo' : 'Inativo'}
                  </TableCell>
                  <TableCell className="font-mono text-sm tabular-nums">
                    {formulario.validadeDias} {formulario.validadeDias === 1 ? 'dia' : 'dias'}
                  </TableCell>
                  <TableCell className="font-mono text-sm tabular-nums">
                    {formatarInstante(formulario.atualizadoEm)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <FormularioDialog
        onCriado={(detalhe) => onAbrir(detalhe.id, `Formulário "${detalhe.nome}" criado.`)}
        onOpenChange={setCriando}
        open={criando}
      />
    </div>
  );
}
