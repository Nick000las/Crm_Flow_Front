import { useState } from 'react';
import { AcessoIndisponivel } from '@/components/acesso-indisponivel';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { isAccessError, toApiError } from '@/services/api';
import { CAMADA, ROTULOS_ACESSO } from '../../constants';
import { usePermissoes, useSalvarPermissoes } from '../../hooks/use-permissoes';
import {
  errosDasPermissoes,
  permissoesMudaram,
  permissoesParaEnvio,
  validarPermissoes,
  valoresDasPermissoes,
} from '../../lib/permissoes';
import { ControleTravado } from '../controle-travado';
import { SelectSimples } from '../select-simples';

const HEAD_CLASS = 'font-mono text-[11px] font-normal uppercase tracking-wide text-muted-foreground';
const OPCOES_ACESSO = Object.entries(ROTULOS_ACESSO).map(([valor, rotulo]) => ({ valor, rotulo }));
const ROTULO_PAPEL = Object.freeze({ OPERADOR: 'Operador' });
const MOTIVO_SEMPRE_EDITAVEL = 'Sempre editável: o lead não existe sem ele.';
const SEM_ERROS = Object.freeze({ porCampo: {}, porPapel: {}, outros: [] });

function Carregando() {
  return (
    <div className="grid gap-2" aria-busy="true">
      <span className="sr-only" role="status">Carregando permissões…</span>
      {Array.from({ length: 6 }, (_, indice) => (
        <Skeleton className="h-10 rounded-none" key={indice} />
      ))}
    </div>
  );
}

/**
 * O rascunho da matriz. Montado com `key` pela resposta: depois de salvar,
 * ela vira a base e o form recomeça limpo.
 */
function FormPermissoes({ config, onSalvo }) {
  const [valores, setValores] = useState(() => valoresDasPermissoes(config));
  const [erros, setErros] = useState(SEM_ERROS);
  const salvar = useSalvarPermissoes();
  const mudou = permissoesMudaram(valores, config);
  const errosDePapel = Object.entries(erros.porPapel);
  const comErroMapeado = errosDePapel.length > 0 || Object.keys(erros.porCampo).length > 0 || erros.outros.length > 0;

  function alterar(papel, campoId, acesso) {
    setValores((atuais) => ({ ...atuais, [papel]: { ...atuais[papel], [campoId]: acesso } }));
    setErros(SEM_ERROS);
    if (salvar.error) salvar.reset();
  }

  function handleSubmit(event) {
    event.preventDefault();
    const locais = validarPermissoes(valores, config);
    if (Object.keys(locais).length > 0) {
      setErros({ ...SEM_ERROS, porPapel: locais });
      return;
    }
    salvar.mutate(permissoesParaEnvio(valores), {
      onSuccess: () => onSalvo('Permissões salvas.'),
      onError: (erro) => setErros(errosDasPermissoes(toApiError(erro).fields, config.papeis)),
    });
  }

  return (
    <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
      {(errosDePapel.length > 0 || erros.outros.length > 0) && (
        <ul className="grid gap-1 border border-destructive px-3 py-2 text-sm text-destructive" role="alert">
          {errosDePapel.map(([papel, mensagem]) => (
            <li key={papel}>
              {ROTULO_PAPEL[papel] ?? papel}: {mensagem}
            </li>
          ))}
          {erros.outros.map((mensagem) => (
            <li key={mensagem}>{mensagem}</li>
          ))}
        </ul>
      )}

      <div aria-busy={salvar.isPending} className="overflow-x-auto border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={HEAD_CLASS} scope="col">
                Campo
              </TableHead>
              {config.papeis.map((papel) => (
                <TableHead className={`${HEAD_CLASS} w-44`} key={papel} scope="col">
                  {ROTULO_PAPEL[papel] ?? papel}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {config.campos.map((campo) => (
              <TableRow key={campo.id}>
                <TableCell className="min-w-48">
                  <span className="text-sm">{campo.label}</span>
                  {campo.camada === CAMADA.CAMADA_3 && (
                    <span className="ml-2 font-mono text-[11px] text-muted-foreground">personalizado</span>
                  )}
                </TableCell>
                {config.papeis.map((papel) => {
                  const id = `permissao-${papel}-${campo.id}`;
                  const motivoId = `${id}-motivo`;
                  const erroId = `${id}-erro`;
                  const erro = erros.porCampo[campo.id]?.[papel] ?? null;
                  const travado = !campo.podeRestringir;

                  return (
                    <TableCell key={papel}>
                      <ControleTravado motivo={travado ? MOTIVO_SEMPRE_EDITAVEL : null} motivoId={motivoId}>
                        <SelectSimples
                          aria-describedby={[travado && motivoId, erro && erroId].filter(Boolean).join(' ') || undefined}
                          aria-invalid={erro ? true : undefined}
                          aria-label={`${campo.label}: acesso do ${ROTULO_PAPEL[papel] ?? papel}`}
                          className={travado ? 'pointer-events-none w-40' : 'w-40'}
                          disabled={travado || salvar.isPending}
                          id={id}
                          onChange={(acesso) => acesso && alterar(papel, campo.id, acesso)}
                          opcoes={OPCOES_ACESSO}
                          value={valores[papel]?.[campo.id] ?? ''}
                        />
                      </ControleTravado>
                      {erro && (
                        <p className="mt-1 text-xs text-destructive" id={erroId}>
                          {erro}
                        </p>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {salvar.error && !comErroMapeado && (
        <ApiErrorAlert error={salvar.error} id="permissoes-erro" title="Não foi possível salvar" />
      )}

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <Button aria-busy={salvar.isPending} disabled={!mudou || salvar.isPending} type="submit">
          {salvar.isPending ? 'Salvando…' : 'Salvar'}
        </Button>
        <Button
          disabled={!mudou || salvar.isPending}
          onClick={() => {
            setValores(valoresDasPermissoes(config));
            setErros(SEM_ERROS);
            salvar.reset();
          }}
          type="button"
          variant="outline"
        >
          Descartar
        </Button>
      </div>
    </form>
  );
}

/**
 * Configurações › Permissões por campo (`crm.permissoes`, DONO/MASTER): o
 * que cada papel configurável edita, só vê ou nem vê. DONO e MASTER sempre
 * veem e editam tudo.
 */
export function SecaoPermissoes() {
  const permissoesQuery = usePermissoes();
  const [aviso, setAviso] = useState(null);
  const erro = permissoesQuery.error;

  if (isAccessError(erro)) return <AcessoIndisponivel error={erro} />;
  if (erro) return <ApiErrorAlert error={erro} id="permissoes-carregar-erro" />;
  if (permissoesQuery.isPending) return <Carregando />;

  const config = permissoesQuery.data;

  return (
    <div className="grid gap-4">
      <div className="grid max-w-2xl gap-1 text-sm text-muted-foreground">
        <p>
          Para cada campo: <strong className="font-medium text-foreground">Editar</strong>,{' '}
          <strong className="font-medium text-foreground">Só ver</strong> (aparece travado no formulário) ou{' '}
          <strong className="font-medium text-foreground">Oculto</strong> (some do lead, da tabela, dos filtros e do
          histórico).
        </p>
        <p>DONO e MASTER sempre veem e editam tudo. E-mail ou telefone precisa continuar editável.</p>
      </div>

      <p className={aviso ? 'border border-border px-3 py-2 text-sm' : 'sr-only'} role="status">
        {aviso}
      </p>

      <FormPermissoes config={config} key={JSON.stringify(config)} onSalvo={setAviso} />
    </div>
  );
}
