import { useState } from 'react';
import { AcessoIndisponivel } from '@/components/acesso-indisponivel';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { podeVer } from '@/lib/acesso';
import { isAccessError } from '@/services/api';
import { PAPEIS_GESTAO } from '../../constants';
import { useConfigLgpd, useSalvarLgpd } from '../../hooks/use-lgpd';
import { SelectSimples } from '../select-simples';

function Carregando() {
  return (
    <div className="grid gap-2" aria-busy="true">
      <span className="sr-only" role="status">Carregando privacidade…</span>
      {Array.from({ length: 3 }, (_, indice) => (
        <Skeleton className="h-12 rounded-none" key={indice} />
      ))}
    </div>
  );
}

const valoresDaConfig = ({ basePadrao, obrigatoria }) => ({ basePadrao: basePadrao ?? '', obrigatoria });

/** Corpo do PUT (`.strict()` no back: só estas duas chaves). */
const paraEnvio = ({ basePadrao, obrigatoria }) => ({ basePadrao: basePadrao || null, obrigatoria });

/**
 * O form da configuração. Montado com `key` pela resposta: depois de salvar,
 * ela vira a base e o form recomeça limpo.
 */
function FormLgpd({ config, podeEditar, onSalvo }) {
  const [valores, setValores] = useState(() => valoresDaConfig(config));
  const salvar = useSalvarLgpd();
  const mudou = JSON.stringify(paraEnvio(valores)) !== JSON.stringify(paraEnvio(valoresDaConfig(config)));
  const travado = salvar.isPending || !podeEditar;

  function alterar(parcial) {
    setValores((atuais) => ({ ...atuais, ...parcial }));
    if (salvar.error) salvar.reset();
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (mudou) salvar.mutate(paraEnvio(valores), { onSuccess: () => onSalvo('Configuração salva.') });
  }

  return (
    <form className="grid max-w-2xl gap-5" noValidate onSubmit={handleSubmit}>
      <div className="grid gap-1.5">
        <label className="text-sm font-medium" htmlFor="lgpd-base-padrao">
          Base legal padrão
        </label>
        <SelectSimples
          aria-describedby="lgpd-base-padrao-ajuda"
          className="max-w-xs"
          disabled={travado}
          id="lgpd-base-padrao"
          onChange={(basePadrao) => alterar({ basePadrao })}
          opcoes={config.basesLegais.map((base) => ({ valor: base.key, rotulo: base.label }))}
          vazio="Nenhuma"
          value={valores.basePadrao}
        />
        <p className="text-xs text-muted-foreground" id="lgpd-base-padrao-ajuda">
          Vem escolhida no cadastro de lead; quem cadastra pode trocar. Lead criado sem base recebe a padrão.
        </p>
      </div>

      <div className="grid gap-1.5">
        <label className="flex items-center gap-2 text-sm" htmlFor="lgpd-obrigatoria">
          <Switch
            aria-describedby="lgpd-obrigatoria-ajuda"
            checked={valores.obrigatoria}
            disabled={travado}
            id="lgpd-obrigatoria"
            onCheckedChange={(obrigatoria) => alterar({ obrigatoria })}
          />
          Base legal obrigatória
        </label>
        <p className="text-xs text-muted-foreground" id="lgpd-obrigatoria-ajuda">
          Sem base (e sem padrão), o lead não é salvo; no import, escolha a base do lote. É o mesmo "obrigatório" do
          campo Base legal em Configurações › Campos.
        </p>
      </div>

      <ApiErrorAlert error={salvar.error} id="lgpd-erro" title="Não foi possível salvar" />

      {podeEditar && (
        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <Button aria-busy={salvar.isPending} disabled={!mudou || travado} type="submit">
            {salvar.isPending ? 'Salvando…' : 'Salvar'}
          </Button>
          <Button
            disabled={!mudou || travado}
            onClick={() => {
              setValores(valoresDaConfig(config));
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
 * Configurações › Privacidade (`crm.lgpd`): base legal padrão e se ela é
 * obrigatória. Todos leem; só DONO/MASTER alteram. Anonimizar um lead fica
 * no próprio lead (menu "⋯").
 */
export function SecaoLgpd() {
  const { user } = useAuth();
  const podeEditar = podeVer({ roles: PAPEIS_GESTAO }, user);
  const configQuery = useConfigLgpd();
  const [aviso, setAviso] = useState(null);
  const erro = configQuery.error;

  if (isAccessError(erro)) return <AcessoIndisponivel error={erro} />;
  if (erro) return <ApiErrorAlert error={erro} id="lgpd-carregar-erro" />;
  if (configQuery.isPending) return <Carregando />;

  const config = configQuery.data;

  return (
    <div className="grid gap-4">
      <div className="grid max-w-2xl gap-1 text-sm text-muted-foreground">
        <p>
          Todo lead guarda a base legal (LGPD), a data em que ela foi registrada, a origem do registro e o opt-out de
          marketing. Salvar mostra esses campos no detalhe, na tabela e nos filtros.
        </p>
        <p>
          {podeEditar
            ? 'Para anonimizar um lead a pedido do titular, use "Anonimizar…" no menu ⋯ do lead.'
            : 'Só DONO e MASTER alteram a privacidade.'}
        </p>
      </div>

      <p className={aviso ? 'border border-border px-3 py-2 text-sm' : 'sr-only'} role="status">
        {aviso}
      </p>

      <FormLgpd config={config} key={JSON.stringify(config)} onSalvo={setAviso} podeEditar={podeEditar} />
    </div>
  );
}
