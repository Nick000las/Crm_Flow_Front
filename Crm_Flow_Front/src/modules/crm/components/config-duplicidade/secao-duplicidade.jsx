import { useState } from 'react';
import { AcessoIndisponivel } from '@/components/acesso-indisponivel';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { podeVer } from '@/lib/acesso';
import { isAccessError } from '@/services/api';
import { ACOES_DUPLICIDADE, PAPEIS_GESTAO, ROTULOS_ACAO_DUPLICIDADE } from '../../constants';
import { useRegrasDuplicidade, useSalvarRegras } from '../../hooks/use-duplicidade';
import { regrasParaEnvio, valoresDasRegras } from '../../lib/duplicidade';
import { SelectSimples } from '../select-simples';

const OPCOES_ACAO = Object.values(ACOES_DUPLICIDADE).map((valor) => ({
  valor,
  rotulo: ROTULOS_ACAO_DUPLICIDADE[valor],
}));

function Carregando() {
  return (
    <div className="grid gap-2" aria-busy="true">
      <span className="sr-only" role="status">Carregando regras…</span>
      {Array.from({ length: 4 }, (_, indice) => (
        <Skeleton className="h-12 rounded-none" key={indice} />
      ))}
    </div>
  );
}

/**
 * O form das regras. Montado com `key` pela configuração: depois de salvar,
 * a resposta vira a base e o form recomeça limpo.
 */
function FormRegras({ regras, podeEditar, onSalvo }) {
  const [valores, setValores] = useState(() => valoresDasRegras(regras));
  const salvar = useSalvarRegras();
  const mudancas = regrasParaEnvio(valores, regras);

  function alterar(campo, parcial) {
    setValores((atuais) => ({ ...atuais, [campo]: { ...atuais[campo], ...parcial } }));
    if (salvar.error) salvar.reset();
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (mudancas) salvar.mutate(mudancas, { onSuccess: () => onSalvo('Regras de duplicidade salvas.') });
  }

  return (
    <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
      <ul className="border border-border">
        {regras.map(({ campo, label }) => {
          const atual = valores[campo];
          const idAtivo = `duplicidade-${campo}-ativo`;
          const idAcao = `duplicidade-${campo}-acao`;

          return (
            <li
              className="grid items-center gap-3 border-b border-border px-3 py-2 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto_12rem]"
              key={campo}
            >
              <span className="text-sm font-medium">{label}</span>
              <label className="flex items-center gap-2 text-sm" htmlFor={idAtivo}>
                <Switch
                  checked={atual.ativo}
                  disabled={!podeEditar || salvar.isPending}
                  id={idAtivo}
                  onCheckedChange={(ativo) => alterar(campo, { ativo })}
                />
                {atual.ativo ? 'Checar' : 'Não checar'}
                <span className="sr-only"> {label}</span>
              </label>
              <SelectSimples
                aria-label={`O que fazer com ${label} repetido`}
                disabled={!podeEditar || !atual.ativo || salvar.isPending}
                id={idAcao}
                onChange={(acao) => acao && alterar(campo, { acao })}
                opcoes={OPCOES_ACAO}
                value={atual.acao}
              />
            </li>
          );
        })}
      </ul>

      <ApiErrorAlert error={salvar.error} id="duplicidade-erro" title="Não foi possível salvar as regras" />

      {podeEditar && (
        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <Button aria-busy={salvar.isPending} disabled={!mudancas || salvar.isPending} type="submit">
            {salvar.isPending ? 'Salvando…' : 'Salvar regras'}
          </Button>
          <Button
            disabled={!mudancas || salvar.isPending}
            onClick={() => {
              setValores(valoresDasRegras(regras));
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
 * Configurações › Duplicidade (`crm.duplicidade`): por campo, se checa e o
 * que fazer com o repetido — avisar (pede confirmação ao salvar) ou bloquear.
 * Todos leem; só DONO/MASTER alteram (o back barra com 403).
 */
export function SecaoDuplicidade() {
  const { user } = useAuth();
  const podeEditar = podeVer({ roles: PAPEIS_GESTAO }, user);
  const regrasQuery = useRegrasDuplicidade();
  const [aviso, setAviso] = useState(null);

  if (isAccessError(regrasQuery.error)) return <AcessoIndisponivel error={regrasQuery.error} />;
  if (regrasQuery.error) return <ApiErrorAlert error={regrasQuery.error} id="duplicidade-carregar-erro" />;
  if (regrasQuery.isPending) return <Carregando />;

  const { regras, configurado } = regrasQuery.data;

  return (
    <div className="grid gap-4">
      <div className="grid max-w-2xl gap-1 text-sm text-muted-foreground">
        <p>
          Ao criar, editar ou importar um lead, o CRM procura outro com o mesmo dado. <strong>Avisar</strong> mostra
          os parecidos e deixa salvar mesmo assim; <strong>Bloquear</strong> não deixa salvar.
        </p>
        {!configurado && <p>A empresa ainda usa as regras padrão do CRM.</p>}
        {!podeEditar && <p>Só DONO e MASTER alteram as regras.</p>}
      </div>

      <p className={aviso ? 'border border-border px-3 py-2 text-sm' : 'sr-only'} role="status">
        {aviso}
      </p>

      <FormRegras
        key={JSON.stringify(regras)}
        onSalvo={setAviso}
        podeEditar={podeEditar}
        regras={regras}
      />
    </div>
  );
}
