import { focusFirstInvalidField } from '@/lib/form-validation';
import { LoadingState } from '@/components/loading-state';
import { Form } from '@/components/ui/form';
import { useState } from 'react';
import { ApiErrorAlert } from '@/components/api-error-alert';
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
import { Skeleton } from '@/components/ui/skeleton';
import { semChave } from '@/lib/objetos';
import { toApiError } from '@/services/api';
import { useLead } from '../../hooks/use-lead';
import { useAtualizarLead } from '../../hooks/use-lead-mutations';
import { useEditarOportunidade, useOportunidades } from '../../hooks/use-oportunidades';
import {
  errosDoServidor,
  idNoForm,
  montarPayloadEdicao,
  payloadVazio,
  validarNoCliente,
  valoresIniciais,
} from '../../lib/form-lead';
import { payloadDaEdicao, valoresDaOportunidade } from '../../lib/oportunidades';
import {
  CODIGO_CAMPOS_OBRIGATORIOS,
  camposDoMover,
  pedeOutrosCampos,
  separarObrigatorios,
} from '../../lib/quadro';
import { avisoDoFormulario } from '../../lib/quadro-consulta';
import { CampoDinamico } from '../campo-dinamico';
import { ErrosDoDialog } from '../oportunidades/erros-do-dialog';

const ERRO_ID = 'quadro-obrigatorios-erro';

const obrigatorio = (campo) => ({ ...campo, obrigatorio: true });

/** Valores do form: comercial da oportunidade movida, nunca o da principal do lead. */
function valoresDoForm({ noMover, daOportunidade, doLead }, oportunidade, lead) {
  const comerciais = {
    ...valoresDaOportunidade(oportunidade),
    motivoPerda: oportunidade.motivoPerda ?? '',
  };

  return {
    ...valoresIniciais(doLead, lead),
    ...Object.fromEntries(
      [...daOportunidade, ...noMover].map((campo) => [idNoForm(campo), comerciais[campo.chave]]),
    ),
  };
}

/**
 * Montado com os dados já lidos. Grava em ordem: oportunidade, contato e, por
 * último, repete o `mover`, que leva o motivo e a probabilidade (`campos`) e diz
 * se o card saiu do filtro.
 * Se a última etapa falhar, as anteriores ficam, e reenviar é seguro: o diff
 * parte do que recarregou e sai vazio.
 */
function FormObrigatorios({
  pendencia,
  obrigatorios,
  oportunidade,
  lead,
  onMover,
  onRecusado,
  onSalvo,
}) {
  const { card } = pendencia;
  const { noMover, daOportunidade, doLead, bloqueados } = obrigatorios;
  const lista = [...noMover, ...daOportunidade, ...doLead].map(obrigatorio);
  const chaves = new Set(lista.map((campo) => campo.chave));

  const editar = useEditarOportunidade(card.leadId);
  const atualizarLead = useAtualizarLead(card.leadId);
  const [valores, setValores] = useState(() => valoresDoForm(obrigatorios, oportunidade, lead));
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState(null);
  const [outros, setOutros] = useState([]);
  const [enviando, setEnviando] = useState(false);

  function alterar(id, valor) {
    setValores((atuais) => ({ ...atuais, [id]: valor }));
    setErros((atuais) => semChave(atuais, id));
    setErroGeral(null);
  }

  /** @returns {Promise<string>} a versão da oportunidade depois de gravar */
  async function gravarOportunidade() {
    const corpo = payloadDaEdicao(
      oportunidade,
      { ...valoresDaOportunidade(oportunidade), ...valores },
      daOportunidade,
    );
    if (!corpo) {
      return oportunidade.atualizadaEm;
    }
    const salva = await editar.mutateAsync({ id: oportunidade.id, corpo });
    return salva.atualizadaEm;
  }

  async function gravarContato() {
    const corpo = montarPayloadEdicao(doLead, valoresIniciais(doLead, lead), {
      ...valoresIniciais(doLead, lead),
      ...valores,
    });
    if (!payloadVazio(corpo)) {
      await atualizarLead.mutateAsync(corpo);
    }
  }

  function tratarErro(error) {
    const erro = toApiError(error);
    if (erro.code === CODIGO_CAMPOS_OBRIGATORIOS && pedeOutrosCampos(erro.fields, chaves)) {
      onRecusado(erro);
      return;
    }
    const { porCampo, gerais } = errosDoServidor(erro.fields, lista);
    setErros(porCampo);
    setOutros(gerais);
    setErroGeral(gerais.length > 0 || Object.keys(porCampo).length === 0 ? erro : null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const locais = validarNoCliente(lista, valores);
    setErros(locais);
    setErroGeral(null);
    setOutros([]);
    if (Object.keys(locais).length > 0) {
      focusFirstInvalidField(
        event.currentTarget,
        Object.keys(locais).map((id) => `quadro-obrigatorio-${id}`),
      );
      return;
    }

    setEnviando(true);
    try {
      const versao = await gravarOportunidade();
      await gravarContato();
      const campos = camposDoMover(noMover, valores);
      const resposta = await onMover(pendencia, { versao, ...(campos && { campos }) });
      onSalvo(avisoDoFormulario(resposta, pendencia.padraoDoDestino));
    } catch (error) {
      tratarErro(error);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Form className="grid gap-4" noValidate onSubmit={handleSubmit}>
      {lista.map((campo) => {
        const id = idNoForm(campo);

        return (
          <CampoDinamico
            campo={campo}
            erro={erros[id]}
            id={`quadro-obrigatorio-${id}`}
            key={id}
            onChange={(valor) => alterar(id, valor)}
            value={valores[id]}
          />
        );
      })}

      {bloqueados.length > 0 && (
        <div
          className="grid gap-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          role="alert"
        >
          <p>Estes dados dependem de outra pessoa com acesso a eles:</p>
          <ul className="list-inside list-disc">
            {bloqueados.map((mensagem) => (
              <li key={mensagem}>{mensagem}</li>
            ))}
          </ul>
        </div>
      )}

      <ErrosDoDialog
        erro={erroGeral}
        id={ERRO_ID}
        mostrar={Boolean(erroGeral)}
        outros={outros}
        titulo="Não foi possível mover o card"
      />

      <DialogFooter>
        <DialogClose render={<Button disabled={enviando} type="button" variant="outline" />}>
          Cancelar
        </DialogClose>
        <Button
          aria-busy={enviando}
          disabled={enviando || bloqueados.length > 0 || lista.length === 0}
          type="submit"
          loading={enviando}
          loadingText="Salvando…"
        >
          Salvar e mover
        </Button>
      </DialogFooter>
    </Form>
  );
}

/** Lê a oportunidade e o lead atuais: o card pode estar velho e não traz tudo. */
function ConteudoDoDialog({ pendencia, campos, onMover, onRecusado, onSalvo }) {
  const { card, erro } = pendencia;
  const oportunidadesQuery = useOportunidades(card.leadId);
  const leadQuery = useLead(card.leadId);
  const falha = oportunidadesQuery.error ?? leadQuery.error;

  if (falha) {
    return <ApiErrorAlert error={falha} id={`${ERRO_ID}-carregar`} />;
  }
  if (oportunidadesQuery.isPending || leadQuery.isPending) {
    return (
      <div className="grid gap-2" aria-busy="true">
        <LoadingState label="Carregando dados do card…" />
        <Skeleton className="h-9" />
        <Skeleton className="h-9" />
      </div>
    );
  }

  const oportunidade = oportunidadesQuery.data.find((item) => item.id === card.entidadeId);
  if (!oportunidade) {
    return <p className="text-sm">Esta oportunidade não está mais disponível.</p>;
  }

  return (
    <FormObrigatorios
      // Por conteúdo: o próximo personalizado repete a chave `customFields`.
      key={JSON.stringify(erro.fields)}
      lead={leadQuery.data}
      obrigatorios={separarObrigatorios(erro.fields, campos)}
      onMover={onMover}
      onRecusado={onRecusado}
      onSalvo={onSalvo}
      oportunidade={oportunidade}
      pendencia={pendencia}
    />
  );
}

/**
 * Aceite 1 do M3: o movimento foi recusado com `CAMPOS_OBRIGATORIOS`, o card já
 * voltou, e aqui se preenche o que falta para concluir. Aberto enquanto houver
 * `pendencia`.
 *
 * @param {{
 *   pendencia: {
 *     card: import('../../api/quadro.api').CardQuadro,
 *     de: string,
 *     destino: import('../../api/quadro.api').ColunaQuadro,
 *     erro: import('@/services/api-error').ApiError,
 *     padraoDoDestino?: number | null,
 *   } | null,
 *   campos: import('../../types').Campo[],
 *   onFechar: () => void,
 *   onMover: (
 *     pendencia: { card: object, de: string, destino: object },
 *     extras: {
 *       versao: string,
 *       campos?: { motivoPerda?: string | null, probabilidadeFechamento?: number | null },
 *     },
 *   ) => Promise<import('../../api/quadro.api').ResultadoDoMover>,
 *   onRecusado: (erro: import('@/services/api-error').ApiError) => void,
 *   onSalvo: (aviso: string) => void,
 * }} props `campos`: todos os de `/fields`, com a permissão do papel;
 *   `padraoDoDestino`: a probabilidade padrão do status da coluna, para o aviso
 */
export function CamposObrigatoriosDialog({
  pendencia,
  campos,
  onFechar,
  onMover,
  onRecusado,
  onSalvo,
}) {
  return (
    <Dialog onOpenChange={(aberto) => !aberto && onFechar()} open={Boolean(pendencia)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Falta preencher para mover</DialogTitle>
          <DialogDescription>
            {pendencia
              ? `Para ir a ${pendencia.destino.nome}, ${pendencia.card.titulo} precisa destes dados.`
              : null}
          </DialogDescription>
        </DialogHeader>
        {pendencia && (
          <ConteudoDoDialog
            campos={campos}
            key={pendencia.card.entidadeId}
            onMover={onMover}
            onRecusado={onRecusado}
            onSalvo={onSalvo}
            pendencia={pendencia}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
