import { ListChecks, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { AcessoIndisponivel } from '@/components/acesso-indisponivel';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { ModulePlaceholder } from '@/components/module-placeholder';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { isAccessError } from '@/services/api';
import { useCampos } from '../../hooks/use-campos';
import { useEditarRegra, useRegras } from '../../hooks/use-regras';
import { descreverRegra } from '../../lib/regras';
import { BotaoIcone } from '../botao-icone';
import { ExcluirRegraDialog } from './excluir-regra-dialog';
import { RegraDialog } from './regra-dialog';

const CAMPOS_VAZIOS = [];

function Carregando() {
  return (
    <div className="grid gap-2" aria-busy="true">
      <span className="sr-only" role="status">
        Carregando regras…
      </span>
      {Array.from({ length: 4 }, (_, indice) => (
        <Skeleton className="h-14 rounded-none" key={indice} />
      ))}
    </div>
  );
}

/** Uma regra: campo, frase, selo do sistema, liga/desliga e ações. */
function LinhaRegra({ regra, descricao, alternando, onAlternar, onEditar, onExcluir }) {
  const idAtivo = `regra-${regra.id}-ativa`;

  return (
    <li className="flex flex-wrap items-center gap-3 border-b border-border px-3 py-2 last:border-b-0">
      <div className="grid min-w-0 flex-1 gap-0.5">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
          {regra.alvo.label}
          {regra.sistema && (
            <Badge className="rounded-none" variant="outline">
              Sistema
            </Badge>
          )}
        </p>
        <p className="text-sm text-muted-foreground">{descricao}</p>
      </div>

      <label className="flex items-center gap-2 text-sm" htmlFor={idAtivo}>
        <Switch
          aria-busy={alternando}
          checked={regra.ativo}
          disabled={alternando}
          id={idAtivo}
          onCheckedChange={onAlternar}
        />
        {regra.ativo ? 'Ligada' : 'Desligada'}
        <span className="sr-only">: {regra.alvo.label}</span>
      </label>

      {/* A regra do sistema só liga e desliga (o back dá 409 no resto). */}
      {!regra.sistema && (
        <div className="flex">
          <BotaoIcone
            icone={Pencil}
            onClick={onEditar}
            rotulo={`Editar regra de ${regra.alvo.label}`}
          />
          <BotaoIcone
            icone={Trash2}
            onClick={onExcluir}
            rotulo={`Excluir regra de ${regra.alvo.label}`}
          />
        </div>
      )}
    </li>
  );
}

/**
 * Configurações › Regras de campo (`crm.regras`, DONO/MASTER): quando um
 * campo fica obrigatório ou só aparece no formulário do lead.
 */
export function SecaoRegras() {
  const regrasQuery = useRegras();
  const camposQuery = useCampos();
  const alternar = useEditarRegra();
  // `undefined` = fechado; `null` = criando; objeto = editando.
  const [emEdicao, setEmEdicao] = useState(undefined);
  const [aExcluir, setAExcluir] = useState(null);
  const [aviso, setAviso] = useState(null);

  const erro = regrasQuery.error ?? camposQuery.error;
  if (isAccessError(erro)) {
    return <AcessoIndisponivel error={erro} />;
  }
  if (erro) {
    return <ApiErrorAlert error={erro} id="config-regras-carregar-erro" />;
  }
  if (regrasQuery.isPending || camposQuery.isPending) {
    return <Carregando />;
  }

  const regras = regrasQuery.data;
  const campos = camposQuery.data ?? CAMPOS_VAZIOS;

  function abrir(acao) {
    setAviso(null);
    alternar.reset();
    acao();
  }

  function alternarAtiva(regra, ativo) {
    setAviso(null);
    alternar.mutate(
      { id: regra.id, parcial: { ativo } },
      { onSuccess: () => setAviso(ativo ? 'Regra ligada.' : 'Regra desligada.') },
    );
  }

  const botaoNova = (
    <Button onClick={() => abrir(() => setEmEdicao(null))}>
      <Plus aria-hidden="true" />
      Nova regra
    </Button>
  );

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Valem no formulário do lead, na edição e no import. Campo obrigatório por regra ganha
          asterisco; campo que só aparece com a condição fica escondido até ela valer.
        </p>
        {regras.length > 0 && botaoNova}
      </div>

      <p className={aviso ? 'border border-border px-3 py-2 text-sm' : 'sr-only'} role="status">
        {aviso}
      </p>
      <ApiErrorAlert
        error={alternar.error}
        id="config-regras-alternar-erro"
        title="Não foi possível mudar a regra"
      />

      {regras.length === 0 ? (
        <ModulePlaceholder
          description="Ex.: Motivo da perda obrigatório quando o status é Perdido."
          icon={ListChecks}
          title="Nenhuma regra ainda"
        >
          {botaoNova}
        </ModulePlaceholder>
      ) : (
        <ul className="border border-border">
          {regras.map((regra) => (
            <LinhaRegra
              alternando={alternar.isPending && alternar.variables?.id === regra.id}
              descricao={descreverRegra(regra, campos)}
              key={regra.id}
              onAlternar={(ativo) => alternarAtiva(regra, ativo)}
              onEditar={() => abrir(() => setEmEdicao(regra))}
              onExcluir={() => abrir(() => setAExcluir(regra))}
              regra={regra}
            />
          ))}
        </ul>
      )}

      <RegraDialog
        campos={campos}
        onOpenChange={(aberto) => !aberto && setEmEdicao(undefined)}
        onSalvo={(texto) => texto && setAviso(texto)}
        open={emEdicao !== undefined}
        regra={emEdicao}
      />
      <ExcluirRegraDialog
        descricao={aExcluir ? descreverRegra(aExcluir, campos) : ''}
        onExcluida={() => setAviso('Regra excluída.')}
        onOpenChange={(aberto) => !aberto && setAExcluir(null)}
        regra={aExcluir}
      />
    </div>
  );
}
