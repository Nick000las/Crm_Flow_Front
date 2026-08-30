import { focusFirstInvalidField } from '@/lib/form-validation';
import { Form } from '@/components/ui/form';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { semChave } from '@/lib/objetos';
import { toApiError } from '@/services/api';
import { useCriarOportunidade, useEditarOportunidade } from '../../hooks/use-oportunidades';
import { useUsuarios } from '../../hooks/use-usuarios';
import {
  acessoAosDados,
  errosDoDialog,
  payloadDaCriacao,
  payloadDaEdicao,
  validarOportunidade,
  valoresDaOportunidade,
  versaoDoConflito,
} from '../../lib/oportunidades';
import { pipelinesAtivos, statusAbertos, statusDoPipeline } from '../../lib/pipelines';
import { CampoForm } from '../campo-form';
import { SelectSimples } from '../select-simples';
import { CamposOportunidade } from './campos-oportunidade';
import { ErrosDoDialog } from './erros-do-dialog';

const CHAVES_DO_DIALOG = Object.freeze([
  'pipelineId',
  'status',
  'titulo',
  'valor',
  'probabilidadeFechamento',
  'dataPrevistaFechamento',
  'responsavelId',
]);
const STATUS_AUTOMATICO = 'Primeiro status aberto';

const padroesDoLead = (lead, pipelines) => ({
  pipelineId: pipelines.find((pipeline) => pipeline.padrao)?.id,
  responsavelId: lead.usuario_responsavel_id,
});

function FormOportunidade({ oportunidade, lead, pipelines, campos, onSalvo, onConflito }) {
  const editando = Boolean(oportunidade);
  const { usuarios } = useUsuarios();
  const criar = useCriarOportunidade(lead.id);
  const editar = useEditarOportunidade(lead.id);
  const mutacao = editando ? editar : criar;
  const [valores, setValores] = useState(() =>
    valoresDaOportunidade(oportunidade, padroesDoLead(lead, pipelines)),
  );
  const [errosCliente, setErrosCliente] = useState({});
  const acesso = acessoAosDados(campos);
  const pipeline = pipelines.find((item) => item.id === valores.pipelineId);
  const conflito = versaoDoConflito(mutacao.error ? toApiError(mutacao.error) : null);
  const { porCampo, outros } = errosDoDialog(
    mutacao.error ? toApiError(mutacao.error) : null,
    CHAVES_DO_DIALOG,
  );
  const semCampo =
    Boolean(mutacao.error) &&
    !conflito &&
    (Object.keys(porCampo).length === 0 || outros.length > 0);

  const erroDe = (chave) => errosCliente[chave] ?? porCampo[chave];

  function alterar(chave, valor) {
    setValores((atuais) => ({ ...atuais, [chave]: valor }));
    setErrosCliente((atuais) => semChave(atuais, chave));
    if (mutacao.error) {
      mutacao.reset();
    }
  }

  function trocarPipeline(pipelineId) {
    // Status é por pipeline: o escolhido não vale no outro.
    setValores((atuais) => ({ ...atuais, pipelineId, status: '' }));
    mutacao.reset();
  }

  function handleSubmit(event) {
    event.preventDefault();
    const erros = validarOportunidade(valores);
    if (Object.keys(erros).length > 0) {
      setErrosCliente(erros);
      const ids = {
        leadId: 'quadro-busca-pessoa',
        pipelineId: 'oportunidade-pipeline',
        status: 'oportunidade-status-inicial',
        dataPrevistaFechamento: 'oportunidade-data',
        responsavelId: 'oportunidade-responsavel',
      };
      focusFirstInvalidField(
        event.currentTarget,
        Object.keys(erros).map((campo) => ids[campo] ?? `oportunidade-${campo}`),
      );
      return;
    }

    if (!editando) {
      criar.mutate(payloadDaCriacao(valores, campos), {
        onSuccess: () => onSalvo('Oportunidade criada.'),
      });
      return;
    }

    const corpo = payloadDaEdicao(oportunidade, valores, campos);
    if (!corpo) {
      onSalvo(null);
      return;
    }
    editar.mutate(
      { id: oportunidade.id, corpo },
      {
        onSuccess: () => onSalvo('Oportunidade salva.'),
        onError: (erro) => {
          const atual = versaoDoConflito(toApiError(erro));
          if (atual) {
            onConflito(atual);
          }
        },
      },
    );
  }

  return (
    <Form className="grid gap-4" noValidate onSubmit={handleSubmit}>
      {!editando && (
        <>
          <CampoForm erro={erroDe('pipelineId')} id="oportunidade-pipeline" label="Pipeline">
            {(controle) => (
              <SelectSimples
                {...controle}
                onChange={trocarPipeline}
                opcoes={pipelinesAtivos(pipelines)}
                value={valores.pipelineId}
              />
            )}
          </CampoForm>
          <CampoForm erro={erroDe('status')} id="oportunidade-status-inicial" label="Status">
            {(controle) => (
              <SelectSimples
                {...controle}
                onChange={(valor) => alterar('status', valor)}
                opcoes={statusAbertos(pipeline)}
                value={valores.status}
                vazio={STATUS_AUTOMATICO}
              />
            )}
          </CampoForm>
        </>
      )}

      <CamposOportunidade
        acesso={acesso}
        erroDe={erroDe}
        focarTitulo
        onChange={alterar}
        probabilidadePadrao={
          statusDoPipeline(pipelines, valores.pipelineId, valores.status)?.probabilidadePadrao
        }
        usuarios={usuarios}
        valores={valores}
      />

      <ErrosDoDialog
        erro={mutacao.error}
        id="oportunidade-erro"
        mostrar={semCampo}
        outros={outros}
        titulo="Não foi possível salvar"
      />

      <DialogFooter>
        <DialogClose
          render={<Button disabled={mutacao.isPending} type="button" variant="outline" />}
        >
          Cancelar
        </DialogClose>
        <Button
          aria-busy={mutacao.isPending}
          disabled={mutacao.isPending}
          type="submit"
          loading={mutacao.isPending}
          loadingText="Salvando…"
        >
          {editando ? 'Salvar alterações' : 'Criar oportunidade'}
        </Button>
      </DialogFooter>
    </Form>
  );
}

/**
 * Corpo do dialog. Guarda a versão que o form edita: o 409 traz a atual, e
 * "Carregar versão atual" remonta o form a partir dela. O rascunho só se perde
 * nesse clique, como no card do Kanban.
 */
function ConteudoDoDialog({ oportunidade, onSalvo, ...form }) {
  const [base, setBase] = useState(oportunidade);
  const [maisNova, setMaisNova] = useState(null);

  return (
    <>
      {maisNova && (
        <div
          className="grid justify-items-start gap-2 rounded-lg border border-border bg-surface px-3 py-2"
          role="alert"
        >
          <p className="text-sm">Outra pessoa alterou esta oportunidade enquanto você editava.</p>
          <Button
            onClick={() => {
              setBase(maisNova);
              setMaisNova(null);
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            Carregar versão atual
          </Button>
        </div>
      )}
      <FormOportunidade
        {...form}
        key={base?.atualizadaEm ?? 'nova'}
        onConflito={setMaisNova}
        onSalvo={onSalvo}
        oportunidade={base}
      />
    </>
  );
}

/**
 * Criar ou editar. Ganhar e perder ficam no `MudarStatusDialog`, que tem o
 * motivo: na criação, só status abertos.
 *
 * @param {{
 *   oportunidade?: import('../../api/oportunidades.api').Oportunidade | null,
 *   lead: import('../../types').Lead,
 *   pipelines: import('../../api/pipelines.api').Pipeline[],
 *   campos: import('../../types').Campo[],
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   onSalvo: (aviso: string | null) => void,
 * }} props `onSalvo(null)` = nada mudou
 */
export function OportunidadeDialog({
  oportunidade,
  lead,
  pipelines,
  campos,
  open,
  onOpenChange,
  onSalvo,
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{oportunidade ? 'Editar oportunidade' : 'Nova oportunidade'}</DialogTitle>
          <DialogDescription>
            {oportunidade
              ? 'Para ganhar ou perder, use "Mudar status".'
              : 'Fica na ficha desta pessoa, com status próprio.'}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ConteudoDoDialog
            campos={campos}
            key={oportunidade?.id ?? 'nova'}
            lead={lead}
            onSalvo={(aviso) => {
              onOpenChange(false);
              onSalvo(aviso);
            }}
            oportunidade={oportunidade}
            pipelines={pipelines}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
