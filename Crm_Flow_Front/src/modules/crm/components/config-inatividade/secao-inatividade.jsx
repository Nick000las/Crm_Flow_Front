import { useState } from 'react';
import { AcessoIndisponivel } from '@/components/acesso-indisponivel';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { podeVer } from '@/lib/acesso';
import { getFieldError, isAccessError } from '@/services/api';
import { INATIVIDADE, PAPEIS_GESTAO } from '../../constants';
import { useInatividade, useSalvarInatividade } from '../../hooks/use-inatividade';
import {
  alternarStatus,
  errosLocais,
  inatividadeParaEnvio,
  statusEsfria,
  valoresDaInatividade,
} from '../../lib/inatividade';
import { OpcaoBadge } from '../opcao-badge';

const PREFIXO_ERRO = 'status.';

function Carregando() {
  return (
    <div className="grid gap-2" aria-busy="true">
      <span className="sr-only" role="status">
        Carregando status…
      </span>
      {Array.from({ length: 5 }, (_, indice) => (
        <Skeleton className="h-12 rounded-none" key={indice} />
      ))}
    </div>
  );
}

/** Uma linha por status: liga/desliga e os dias. Fechado fica travado. */
function LinhaStatus({ status, valor, erro, desabilitado, onChange }) {
  const esfria = statusEsfria(status);
  const idSwitch = `inatividade-${status.key}-ligado`;
  const idDias = `inatividade-${status.key}-dias`;
  const idErro = `inatividade-${status.key}-erro`;
  const idNota = `inatividade-${status.key}-nota`;

  return (
    <li className="grid gap-2 border-b border-border px-3 py-2 last:border-b-0">
      <div className="grid items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto_9rem]">
        <span>
          <OpcaoBadge opcao={status} />
        </span>

        <label className="flex items-center gap-2 text-sm" htmlFor={idSwitch}>
          <Switch
            aria-describedby={esfria ? undefined : idNota}
            checked={esfria && valor.ligado}
            disabled={desabilitado || !esfria}
            id={idSwitch}
            onCheckedChange={(ligado) => onChange(alternarStatus(valor, ligado))}
          />
          {esfria && valor.ligado ? 'Esfria' : 'Não esfria'}
          <span className="sr-only"> {status.label}</span>
        </label>

        {esfria ? (
          <div className="flex items-center gap-2">
            <Input
              aria-describedby={erro ? idErro : undefined}
              aria-invalid={Boolean(erro)}
              aria-label={`Dias sem interação até ${status.label} esfriar`}
              className="h-8 w-20 rounded-none font-mono tabular-nums"
              disabled={desabilitado || !valor.ligado}
              id={idDias}
              inputMode="numeric"
              max={INATIVIDADE.DIAS_MAX}
              min={INATIVIDADE.DIAS_MIN}
              onChange={(event) => onChange({ ...valor, dias: event.target.value })}
              value={valor.dias}
            />
            <span className="text-sm text-muted-foreground">dias</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground" id={idNota}>
            Status final não esfria
          </span>
        )}
      </div>

      {erro && (
        <p className="text-xs text-destructive" id={idErro}>
          {erro}
        </p>
      )}
    </li>
  );
}

/**
 * O form dos dias. Montado com `key` pela lista: depois de salvar, a
 * resposta vira a base e o form recomeça limpo.
 */
function FormInatividade({ lista, podeEditar, onSalvo }) {
  const [valores, setValores] = useState(() => valoresDaInatividade(lista));
  const [tentou, setTentou] = useState(false);
  const salvar = useSalvarInatividade();
  const mudancas = inatividadeParaEnvio(valores, lista);
  const erros = tentou ? errosLocais(valores) : {};
  // Erro do back sem campo (rede, permissão) vai para o alerta; o de campo, para a linha.
  const temErroDeCampo =
    salvar.error &&
    Object.keys(salvar.error.fields ?? {}).some((campo) => campo.startsWith(PREFIXO_ERRO));

  function alterar(key, valor) {
    setValores((atuais) => ({ ...atuais, [key]: valor }));
    if (salvar.error) {
      salvar.reset();
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    setTentou(true);
    if (!mudancas || Object.keys(errosLocais(valores)).length > 0) {
      return;
    }

    salvar.mutate(mudancas, { onSuccess: () => onSalvo('Dias de inatividade salvos.') });
  }

  return (
    <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
      <ul aria-label="Dias sem interação por status" className="border border-border">
        {lista.map((status) => (
          <LinhaStatus
            desabilitado={!podeEditar || salvar.isPending}
            erro={
              erros[status.key] ??
              (salvar.error ? getFieldError(salvar.error, `${PREFIXO_ERRO}${status.key}`) : null)
            }
            key={status.key}
            onChange={(valor) => alterar(status.key, valor)}
            status={status}
            valor={valores[status.key]}
          />
        ))}
      </ul>

      {!temErroDeCampo && (
        <ApiErrorAlert error={salvar.error} id="inatividade-erro" title="Não foi possível salvar" />
      )}

      {podeEditar && (
        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <Button
            aria-busy={salvar.isPending}
            disabled={!mudancas || salvar.isPending}
            type="submit"
          >
            {salvar.isPending ? 'Salvando…' : 'Salvar'}
          </Button>
          <Button
            disabled={!mudancas || salvar.isPending}
            onClick={() => {
              setValores(valoresDaInatividade(lista));
              setTentou(false);
              salvar.reset();
            }}
            type="button"
            variant="outline"
          >
            Descartar
          </Button>
        </div>
      )}
    </form>
  );
}

/**
 * Configurações › Inatividade (`crm.inatividade`): por status, quantos dias
 * sem interação até o lead esfriar. Ganho e perdido não esfriam. Todos leem;
 * só DONO/MASTER alteram (o back barra com 403).
 */
export function SecaoInatividade() {
  const { user } = useAuth();
  const podeEditar = podeVer({ roles: PAPEIS_GESTAO }, user);
  const inatividadeQuery = useInatividade();
  const [aviso, setAviso] = useState(null);

  if (isAccessError(inatividadeQuery.error)) {
    return <AcessoIndisponivel error={inatividadeQuery.error} />;
  }
  if (inatividadeQuery.error) {
    return <ApiErrorAlert error={inatividadeQuery.error} id="inatividade-carregar-erro" />;
  }
  if (inatividadeQuery.isPending) {
    return <Carregando />;
  }

  const lista = inatividadeQuery.data;

  return (
    <div className="grid gap-4">
      <div className="grid max-w-2xl gap-1 text-sm text-muted-foreground">
        <p>
          Um lead <strong>esfria</strong> quando fica esses dias sem nenhuma interação enquanto está
          no status. Ele ganha o selo &ldquo;Esfriando&rdquo;, entra na view Esfriando e o
          responsável recebe um resumo diário no sino.
        </p>
        {!podeEditar && <p>Só DONO e MASTER alteram os dias.</p>}
      </div>

      <p className={aviso ? 'border border-border px-3 py-2 text-sm' : 'sr-only'} role="status">
        {aviso}
      </p>

      <FormInatividade
        key={JSON.stringify(lista)}
        lista={lista}
        onSalvo={setAviso}
        podeEditar={podeEditar}
      />
    </div>
  );
}
