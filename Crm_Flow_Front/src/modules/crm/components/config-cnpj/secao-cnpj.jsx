import { useState } from 'react';
import { AcessoIndisponivel } from '@/components/acesso-indisponivel';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { podeVer } from '@/lib/acesso';
import { getFieldError, isAccessError } from '@/services/api';
import { PAPEIS_GESTAO } from '../../constants';
import { useCamposConfigurados } from '../../hooks/use-configuracoes-campos';
import { useConfigCnpj, useSalvarConfigCnpj } from '../../hooks/use-cnpj';
import { camposCompativeis, configMudou, configParaEnvio, valoresDaConfig } from '../../lib/cnpj';
import { SelectSimples } from '../select-simples';

const PREFIXO_ERRO = 'mapeamento.';

const OPCOES_MODO = Object.freeze([
  { valor: 'manual', rotulo: 'Lupa no formulário' },
  { valor: 'automatico', rotulo: 'Automático ao salvar' },
]);

const EFEITO_DO_MODO = Object.freeze({
  manual: 'Quem cadastra clica em "Buscar dados na Receita" ao lado do CNPJ e revisa antes de salvar.',
  automatico: 'Ao salvar um lead com CNPJ, o CRM consulta a Receita em segundo plano e preenche os campos mapeados.',
});

function Carregando() {
  return (
    <div className="grid gap-2" aria-busy="true">
      <span className="sr-only" role="status">Carregando configuração…</span>
      {Array.from({ length: 5 }, (_, indice) => (
        <Skeleton className="h-12 rounded-none" key={indice} />
      ))}
    </div>
  );
}

/**
 * O form da configuração. Montado com `key` pela resposta: depois de salvar,
 * ela vira a base e o form recomeça limpo.
 */
function FormCnpj({ config, campos, podeEditar, onSalvo }) {
  const [valores, setValores] = useState(() => valoresDaConfig(config));
  const salvar = useSalvarConfigCnpj();
  const mudou = configMudou(valores, config);
  // Sem ser gestão, tudo fica travado (o PUT daria 403).
  const ocupado = salvar.isPending || !podeEditar;
  // Erro de destino vai para a linha do dado; o resto, para o alerta.
  const temErroDeLinha =
    salvar.error && Object.keys(salvar.error.fields ?? {}).some((campo) => campo.startsWith(PREFIXO_ERRO));

  function alterar(parcial) {
    setValores((atuais) => ({ ...atuais, ...parcial }));
    if (salvar.error) salvar.reset();
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (mudou) salvar.mutate(configParaEnvio(valores), { onSuccess: () => onSalvo('Configuração salva.') });
  }

  return (
    <form className="grid gap-5" noValidate onSubmit={handleSubmit}>
      <div className="grid max-w-2xl gap-4">
        <label className="flex items-center gap-2 text-sm" htmlFor="cnpj-ativo">
          <Switch
            checked={valores.ativo}
            disabled={ocupado}
            id="cnpj-ativo"
            onCheckedChange={(ativo) => alterar({ ativo })}
          />
          Enriquecer leads pelo CNPJ
        </label>

        <div className="grid gap-1.5">
          <label className="text-sm font-medium" htmlFor="cnpj-modo">
            Como
          </label>
          <SelectSimples
            aria-describedby="cnpj-modo-efeito"
            className="max-w-xs"
            disabled={ocupado || !valores.ativo}
            id="cnpj-modo"
            onChange={(modo) => modo && alterar({ modo })}
            opcoes={OPCOES_MODO}
            value={valores.modo}
          />
          <p className="text-xs text-muted-foreground" id="cnpj-modo-efeito">
            {EFEITO_DO_MODO[valores.modo]}
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm" htmlFor="cnpj-sobrescrever">
          <Switch
            checked={valores.sobrescrever}
            disabled={ocupado || !valores.ativo}
            id="cnpj-sobrescrever"
            onCheckedChange={(sobrescrever) => alterar({ sobrescrever })}
          />
          Sobrescrever campos já preenchidos
        </label>
      </div>

      <fieldset className="grid gap-1.5">
        <legend className="mb-1.5 text-sm font-medium">Para onde vai cada dado da Receita</legend>
        <ul className="border border-border">
          {config.camposReceita.map((dado) => {
            const id = `cnpj-mapa-${dado.chave}`;
            const erroId = `${id}-erro`;
            const erro = salvar.error ? getFieldError(salvar.error, `${PREFIXO_ERRO}${dado.chave}`) : null;
            const opcoes = camposCompativeis(dado, campos).map((campo) => ({ valor: campo.id, rotulo: campo.label }));

            return (
              <li
                className="grid items-center gap-2 border-b border-border px-3 py-2 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_16rem]"
                key={dado.chave}
              >
                <label className="text-sm" htmlFor={id}>
                  {dado.label}
                </label>
                <SelectSimples
                  aria-describedby={erro ? erroId : undefined}
                  aria-invalid={erro ? true : undefined}
                  disabled={ocupado || !valores.ativo}
                  id={id}
                  onChange={(idDoCampo) => alterar({ mapeamento: { ...valores.mapeamento, [dado.chave]: idDoCampo } })}
                  opcoes={opcoes}
                  vazio="Não preencher"
                  value={valores.mapeamento[dado.chave] ?? ''}
                />
                {erro && (
                  <p className="text-xs text-destructive sm:col-span-2" id={erroId}>
                    {erro}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </fieldset>

      {!temErroDeLinha && <ApiErrorAlert error={salvar.error} id="cnpj-erro" title="Não foi possível salvar" />}

      {podeEditar && (
        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <Button aria-busy={salvar.isPending} disabled={!mudou || ocupado} type="submit">
            {salvar.isPending ? 'Salvando…' : 'Salvar'}
          </Button>
          <Button
            disabled={!mudou || ocupado}
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
 * Configurações › Enriquecimento (`crm.cnpj`): liga o enriquecimento pela
 * Receita, escolhe lupa ou automático e mapeia cada dado para um campo do
 * lead de tipo compatível. Todos leem; só DONO/MASTER alteram.
 */
export function SecaoCnpj() {
  const { user } = useAuth();
  const podeEditar = podeVer({ roles: PAPEIS_GESTAO }, user);
  const configQuery = useConfigCnpj();
  const camposQuery = useCamposConfigurados();
  const [aviso, setAviso] = useState(null);
  const erro = configQuery.error ?? camposQuery.error;

  if (isAccessError(erro)) return <AcessoIndisponivel error={erro} />;
  if (erro) return <ApiErrorAlert error={erro} id="cnpj-carregar-erro" />;
  if (configQuery.isPending || camposQuery.isPending) return <Carregando />;

  const config = configQuery.data;

  return (
    <div className="grid gap-4">
      <div className="grid max-w-2xl gap-1 text-sm text-muted-foreground">
        <p>
          Com o CNPJ do lead, o CRM busca razão social, endereço e outros dados públicos na Receita e preenche os
          campos escolhidos abaixo.
        </p>
        {!config.configurado && <p>A empresa ainda usa a configuração padrão.</p>}
        {!podeEditar && <p>Só DONO e MASTER alteram o enriquecimento.</p>}
      </div>

      <p className={aviso ? 'border border-border px-3 py-2 text-sm' : 'sr-only'} role="status">
        {aviso}
      </p>

      <FormCnpj
        campos={camposQuery.data}
        config={config}
        key={JSON.stringify(config)}
        onSalvo={setAviso}
        podeEditar={podeEditar}
      />
    </div>
  );
}
