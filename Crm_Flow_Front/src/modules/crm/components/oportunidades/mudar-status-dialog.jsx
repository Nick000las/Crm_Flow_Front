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
import { toApiError } from '@/services/api';
import { MENSAGEM_SEM_PERMISSAO } from '../../constants';
import { useMudarStatusDaOportunidade } from '../../hooks/use-oportunidades';
import { podeEditarCampo } from '../../lib/form-lead';
import { campoDoMotivo, errosDoDialog, payloadDoStatus, pedeMotivo } from '../../lib/oportunidades';
import { opcoesDoSeletor } from '../../lib/opcoes';
import { statusDisponiveis, statusDoPipeline } from '../../lib/pipelines';
import { CampoForm } from '../campo-form';
import { SelectSimples } from '../select-simples';
import { ErrosDoDialog } from './erros-do-dialog';

const CHAVES_DO_DIALOG = Object.freeze(['status', 'motivoPerda']);
const AVISO_SALVO = 'Status alterado.';
const AVISO_CONFLITO = 'Status alterado, mas outra pessoa mexeu nesta oportunidade antes. Confira.';

/** Montado só com o dialog aberto: cada abertura parte do status atual. */
function FormStatus({ oportunidade, pipelines, campos, leadId, onSalvo }) {
  const mudar = useMudarStatusDaOportunidade(leadId);
  const [status, setStatus] = useState(oportunidade.status ?? '');
  const [motivo, setMotivo] = useState(oportunidade.motivoPerda ?? '');
  const pipeline = pipelines.find((item) => item.id === oportunidade.pipelineId);
  const categoria = statusDoPipeline(pipelines, oportunidade.pipelineId, status)?.category;
  const campoMotivo = campoDoMotivo(campos);
  const comMotivo = pedeMotivo(categoria) && Boolean(campoMotivo);
  const motivoEditavel = Boolean(campoMotivo) && podeEditarCampo(campoMotivo);

  const { porCampo, outros } = errosDoDialog(
    mudar.error ? toApiError(mudar.error) : null,
    CHAVES_DO_DIALOG,
  );
  const semCampo =
    Boolean(mudar.error) && (Object.keys(porCampo).length === 0 || outros.length > 0);

  function alterar(setter, valor) {
    setter(valor);
    mudar.reset();
  }

  function handleSubmit(event) {
    event.preventDefault();
    mudar.mutate(
      {
        id: oportunidade.id,
        corpo: payloadDoStatus(
          oportunidade,
          { status, motivoPerda: motivoEditavel ? motivo : '' },
          categoria,
        ),
      },
      { onSuccess: ({ conflito }) => onSalvo(conflito ? AVISO_CONFLITO : AVISO_SALVO) },
    );
  }

  return (
    <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
      <CampoForm erro={porCampo.status} id="oportunidade-status" label="Status" obrigatorio>
        {(controle) => (
          <SelectSimples
            {...controle}
            onChange={(valor) => alterar(setStatus, valor)}
            opcoes={statusDisponiveis(pipeline, oportunidade.status)}
            value={status}
          />
        )}
      </CampoForm>

      {comMotivo && (
        <CampoForm
          erro={porCampo.motivoPerda}
          id="oportunidade-motivo"
          label={campoMotivo.label}
          motivoTravado={motivoEditavel ? null : MENSAGEM_SEM_PERMISSAO}
        >
          {(controle) => (
            <SelectSimples
              {...controle}
              onChange={(valor) => alterar(setMotivo, valor)}
              opcoes={opcoesDoSeletor(campoMotivo, motivo)}
              value={motivo}
              vazio="Nenhum"
            />
          )}
        </CampoForm>
      )}

      <ErrosDoDialog
        erro={mudar.error}
        id="oportunidade-status-erro"
        mostrar={semCampo}
        outros={outros}
        titulo="Não foi possível mudar o status"
      />

      <DialogFooter>
        <DialogClose render={<Button disabled={mudar.isPending} type="button" variant="outline" />}>
          Cancelar
        </DialogClose>
        <Button
          aria-busy={mudar.isPending}
          disabled={mudar.isPending || !status || status === oportunidade.status}
          type="submit"
        >
          {mudar.isPending ? 'Salvando…' : 'Mudar status'}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * É aqui que se ganha, perde e reabre: a categoria do status escolhido define
 * o efeito no back. Aberto enquanto houver `oportunidade`.
 *
 * @param {{
 *   oportunidade: import('../../api/oportunidades.api').Oportunidade | null,
 *   pipelines: import('../../api/pipelines.api').Pipeline[],
 *   campos: import('../../types').Campo[],
 *   leadId: string,
 *   onOpenChange: (open: boolean) => void,
 *   onSalvo: (aviso: string) => void,
 * }} props
 */
export function MudarStatusDialog({
  oportunidade,
  pipelines,
  campos,
  leadId,
  onOpenChange,
  onSalvo,
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={Boolean(oportunidade)}>
      <DialogContent className="rounded-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mudar status</DialogTitle>
          <DialogDescription>
            Ganho e perdido encerram a oportunidade; voltar a um status aberto a reabre.
          </DialogDescription>
        </DialogHeader>
        {oportunidade && (
          <FormStatus
            campos={campos}
            key={oportunidade.id}
            leadId={leadId}
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
