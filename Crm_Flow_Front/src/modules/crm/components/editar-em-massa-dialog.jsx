import { useMemo, useState } from 'react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useEditarEmMassa } from '../hooks/use-lead-mutations';
import { RESPONSAVEL_NENHUM } from '../lib/filtro';
import { podeEditarCampo } from '../lib/form-lead';
import { tituloDoLead } from '../lib/layout';
import {
  FORM_MASSA_VAZIO,
  alteracoesDoForm,
  falhasDoResultado,
  resumoDoResultado,
} from '../lib/massa';
import { opcoesDoSeletor, sugestoesDoCampo } from '../lib/opcoes';
import { SelectSimples } from './select-simples';
import { TagsInput } from './tags-input';

const ROTULO_TAGS = 'Tags';

/**
 * Uma alteração: o checkbox diz se ela vai no pedido; o controle só edita
 * quando marcado. Sem isso, "tirar o responsável" e "não mexer" seriam iguais.
 */
function Alteracao({ id, rotulo, ativa, onAtivar, erro, desabilitado, children }) {
  const erroId = `${id}-erro`;

  return (
    <fieldset className="grid gap-2 border-b border-border px-3 py-3 last:border-b-0">
      <legend className="sr-only">{rotulo}</legend>
      <label className="flex items-center gap-2 text-sm font-medium" htmlFor={`${id}-ativa`}>
        <Checkbox
          checked={ativa}
          disabled={desabilitado}
          id={`${id}-ativa`}
          onCheckedChange={onAtivar}
        />
        Alterar {rotulo.toLowerCase()}
      </label>
      {ativa &&
        children({
          'aria-describedby': erro ? erroId : undefined,
          'aria-invalid': erro ? true : undefined,
        })}
      {erro && (
        <p className="text-xs text-destructive" id={erroId}>
          {erro}
        </p>
      )}
    </fieldset>
  );
}

/** Depois do pedido: resumo e as falhas, uma por lead. */
function Resultado({ resposta, falhas }) {
  return (
    <div className="grid gap-3">
      <p className="border border-border px-3 py-2 font-mono text-xs tabular-nums" role="status">
        {resumoDoResultado(resposta)}
      </p>
      {falhas.length > 0 && (
        <div className="grid gap-1.5">
          <p className="text-sm font-medium">Não alterados</p>
          <ul className="max-h-60 divide-y divide-border overflow-y-auto border border-border">
            {falhas.map((falha) => (
              <li className="grid gap-0.5 px-3 py-2 text-sm" key={falha.id}>
                <span className="font-medium">{falha.titulo}</span>
                <span className="text-xs text-destructive">{falha.mensagem}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Eles continuam marcados na lista para você corrigir.
          </p>
        </div>
      )}
    </div>
  );
}

/** Conteúdo do dialog. Montado a cada abertura: começa sem nenhuma alteração. */
function FormMassa({ leads, campos, usuarios, identificador, onResultado, onFechar }) {
  const [form, setForm] = useState(FORM_MASSA_VAZIO);
  const [erros, setErros] = useState({});
  const editar = useEditarEmMassa();
  const campoPorChave = useMemo(
    () => new Map(campos.map((campo) => [campo.chave, campo])),
    [campos],
  );
  const resposta = editar.data;
  const ocupado = editar.isPending;

  const falhas = useMemo(() => {
    if (!resposta) {
      return [];
    }
    const tituloPorId = new Map(leads.map((lead) => [lead.id, tituloDoLead(lead, identificador)]));
    const rotuloPorChave = new Map(campos.map((campo) => [campo.chave, campo.label]));
    return falhasDoResultado(resposta.resultados, tituloPorId, rotuloPorChave);
  }, [resposta, leads, identificador, campos]);

  function alterar(chave, parcial) {
    setForm((atual) => ({ ...atual, [chave]: { ...atual[chave], ...parcial } }));
    setErros((atuais) => ({ ...atuais, [chave]: undefined, geral: undefined }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const resultado = alteracoesDoForm(form);
    if ('erros' in resultado) {
      setErros(resultado.erros);
      return;
    }

    editar.mutate(
      { ids: leads.map((lead) => lead.id), alteracoes: resultado.alteracoes },
      { onSuccess: onResultado },
    );
  }

  if (resposta) {
    return (
      <div className="grid gap-4">
        <Resultado falhas={falhas} resposta={resposta} />
        <DialogFooter>
          <Button onClick={onFechar}>Fechar</Button>
        </DialogFooter>
      </div>
    );
  }

  const selecao = (chave, rotulo) => {
    const campo = campoPorChave.get(chave);
    // Oculto (não vem) ou só de ver (permissão por campo): o back daria 403 no pedido inteiro.
    if (!campo || !podeEditarCampo(campo)) {
      return null;
    }

    return (
      <Alteracao
        ativa={form[chave].ativa}
        desabilitado={ocupado}
        erro={erros[chave]}
        id={`massa-${chave}`}
        onAtivar={(ativa) => alterar(chave, { ativa })}
        rotulo={rotulo ?? campo.label}
      >
        {(acessivel) => (
          <SelectSimples
            {...acessivel}
            aria-label={`Novo valor de ${campo.label}`}
            disabled={ocupado}
            onChange={(valor) => alterar(chave, { valor })}
            opcoes={opcoesDoSeletor(campo)}
            value={form[chave].valor}
          />
        )}
      </Alteracao>
    );
  };
  const tags = campoPorChave.get('tags');
  const campoTags = tags && podeEditarCampo(tags) ? tags : null;

  return (
    <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
      <div className="border border-border">
        {selecao('status')}
        {selecao('fonteLead')}

        <Alteracao
          ativa={form.responsavel.ativa}
          desabilitado={ocupado}
          erro={erros.responsavel}
          id="massa-responsavel"
          onAtivar={(ativa) => alterar('responsavel', { ativa })}
          rotulo="Responsável"
        >
          {(acessivel) => (
            <SelectSimples
              {...acessivel}
              aria-label="Novo responsável"
              disabled={ocupado}
              onChange={(valor) => alterar('responsavel', { valor })}
              opcoes={[
                { valor: RESPONSAVEL_NENHUM, rotulo: 'Sem responsável' },
                ...usuarios.map((usuario) => ({ valor: usuario.id, rotulo: usuario.nome })),
              ]}
              value={form.responsavel.valor}
            />
          )}
        </Alteracao>

        {campoTags && (
          <Alteracao
            ativa={form.tags.ativa}
            desabilitado={ocupado}
            erro={erros.tags}
            id="massa-tags"
            onAtivar={(ativa) => alterar('tags', { ativa })}
            rotulo={campoTags.label ?? ROTULO_TAGS}
          >
            {(acessivel) => (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label className="text-xs text-muted-foreground" htmlFor="massa-tags-adicionar">
                    Somar
                  </label>
                  <TagsInput
                    {...acessivel}
                    disabled={ocupado}
                    id="massa-tags-adicionar"
                    onChange={(adicionar) => alterar('tags', { adicionar })}
                    sugestoes={sugestoesDoCampo(campoTags)}
                    value={form.tags.adicionar}
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs text-muted-foreground" htmlFor="massa-tags-remover">
                    Tirar
                  </label>
                  <TagsInput
                    {...acessivel}
                    disabled={ocupado}
                    id="massa-tags-remover"
                    onChange={(remover) => alterar('tags', { remover })}
                    sugestoes={sugestoesDoCampo(campoTags)}
                    value={form.tags.remover}
                  />
                </div>
              </div>
            )}
          </Alteracao>
        )}
      </div>

      {erros.geral && (
        <p className="text-sm text-destructive" role="alert">
          {erros.geral}
        </p>
      )}
      <ApiErrorAlert error={editar.error} id="massa-erro" title="Não foi possível aplicar" />

      <DialogFooter>
        <DialogClose render={<Button disabled={ocupado} type="button" variant="outline" />}>
          Cancelar
        </DialogClose>
        <Button aria-busy={ocupado} disabled={ocupado} type="submit">
          {ocupado
            ? 'Aplicando…'
            : `Aplicar a ${leads.length} ${leads.length === 1 ? 'lead' : 'leads'}`}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Edição em massa (`crm.massa`, qualquer papel): status, origem, responsável
 * e tags dos leads marcados. Cada lead passa pelas regras do PUT (ex.: Perdido
 * exige motivo); quem falha aparece no resultado e continua marcado.
 *
 * @param {{
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   leads: import('../types').Lead[],
 *   campos: import('../types').Campo[],
 *   usuarios: { id: string, nome: string }[],
 *   identificador: import('../lib/layout').ItemLayout | null,
 *   onResultado: (resposta: import('../lib/massa').RespostaMassa) => void,
 * }} props `onResultado` chega assim que o back responde — fechar o dialog
 *   por qualquer caminho (Fechar, Esc, ✕) já encontra a seleção a ajustar
 */
export function EditarEmMassaDialog({ open, onOpenChange, ...form }) {
  const total = form.leads.length;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="rounded-none sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar em massa</DialogTitle>
          <DialogDescription>
            Marque o que muda{' '}
            {total === 1 ? 'no lead selecionado' : `nos ${total} leads selecionados`}. O resto fica
            como está.
          </DialogDescription>
        </DialogHeader>
        {open && <FormMassa {...form} onFechar={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
