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
import { Input } from '@/components/ui/input';
import { getFieldError } from '@/services/api';
import { useAtualizarDataPrevista } from '../../hooks/use-forecast';
import { resumoDaAcao } from '../../lib/forecast';
import { TEXTOS_FORECAST } from '../../lib/forecast-textos';
import { CampoForm } from '../campo-form';

const CAMPO_DATA = 'dataPrevistaFechamento';
const CAMPO_IDS = 'oportunidadeIds';
const DATA_OBRIGATORIA = 'Escolha a data prevista';

/** "Mesma data prevista em N oportunidades". @param {{ total: number }} props */
function Descricao({ total }) {
  return (
    <DialogDescription>
      Mesma data prevista{' '}
      {total === 1 ? (
        'na oportunidade selecionada'
      ) : (
        <>
          em <span className="font-mono tabular-nums">{total}</span> oportunidades
        </>
      )}
      .
    </DialogDescription>
  );
}

/** Depois do pedido: quantas mudaram e, uma por uma, as que ficaram de fora. */
function Resultado({ resumo, onFechar }) {
  return (
    <div className="grid gap-4">
      <p className="border border-border px-3 py-2 font-mono text-xs tabular-nums" role="status">
        {resumo.texto}
      </p>
      {resumo.ignoradas.length > 0 && (
        <div className="grid gap-1.5">
          <p className="text-sm font-medium">
            Não atualizadas{' '}
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              ({resumo.ignoradas.length})
            </span>
          </p>
          <ul className="max-h-60 divide-y divide-border overflow-y-auto border border-border">
            {resumo.ignoradas.map((ignorada) => (
              <li className="grid gap-0.5 px-3 py-2 text-sm" key={ignorada.id}>
                <span className="font-medium">{ignorada.nome}</span>
                <span className="text-xs text-destructive">{ignorada.motivo}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <DialogFooter>
        <Button onClick={onFechar}>Fechar</Button>
      </DialogFooter>
    </div>
  );
}

/**
 * Montado só com o dialog aberto: cada abertura começa sem data e sem
 * resultado. Os itens são os da abertura: a página limpa a seleção em
 * `onConcluido`, e o resultado ainda precisa dos nomes e da contagem.
 */
function FormData({ selecionados, onConcluido, onFechar }) {
  const [enviados] = useState(selecionados);
  const [data, setData] = useState('');
  const [erroCliente, setErroCliente] = useState(null);
  const [resumo, setResumo] = useState(null);
  const atualizar = useAtualizarDataPrevista();
  const ocupado = atualizar.isPending;
  const total = enviados.length;

  const erroDaData =
    erroCliente ?? (atualizar.error ? getFieldError(atualizar.error, CAMPO_DATA) : null);
  const erroDosIds = atualizar.error ? getFieldError(atualizar.error, CAMPO_IDS) : null;
  const erroSemCampo = atualizar.error && !erroDaData && !erroDosIds;

  function alterar(valor) {
    setData(valor);
    setErroCliente(null);
    if (atualizar.error) {
      atualizar.reset();
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!data) {
      setErroCliente(DATA_OBRIGATORIA);
      return;
    }

    atualizar.mutate(
      { oportunidadeIds: enviados.map((item) => item.id), dataPrevistaFechamento: data },
      {
        onSuccess: (resposta) => {
          const proximo = resumoDaAcao(resposta, enviados);
          setResumo(proximo);
          onConcluido?.(proximo);
        },
      },
    );
  }

  if (resumo) {
    return <Resultado onFechar={onFechar} resumo={resumo} />;
  }

  return (
    <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
      <Descricao total={total} />
      <CampoForm erro={erroDaData} id="forecast-data-prevista" label="Data prevista" obrigatorio>
        {(controle) => (
          <Input
            {...controle}
            autoFocus
            className="h-9 w-44 rounded-none font-mono tabular-nums"
            disabled={ocupado}
            onChange={(event) => alterar(event.target.value)}
            required
            type="date"
            value={data}
          />
        )}
      </CampoForm>

      {erroDosIds && (
        <p className="text-sm text-destructive" role="alert">
          {erroDosIds}
        </p>
      )}
      {erroSemCampo && (
        <ApiErrorAlert
          className="rounded-none"
          error={atualizar.error}
          id="forecast-data-erro"
          title="Não foi possível atualizar"
        />
      )}

      <DialogFooter>
        <DialogClose render={<Button disabled={ocupado} type="button" variant="outline" />}>
          Cancelar
        </DialogClose>
        <Button aria-busy={ocupado} disabled={ocupado || total === 0} type="submit">
          {ocupado ? 'Atualizando…' : TEXTOS_FORECAST.atualizarData}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * "Atualizar data prevista" (FC2): a mesma data nas oportunidades abertas
 * marcadas na lista do forecast. Cada uma passa pela edição normal; as que
 * falham voltam em `ignoradas`, com o motivo em texto.
 *
 * @param {{
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   selecionados: import('../../api/forecast.api').ItemForecast[],
 *   onConcluido?: (resumo: ReturnType<typeof resumoDaAcao>) => void,
 * }} props `onConcluido` chega uma vez, assim que o back responde 200
 */
export function AtualizarDataDialog({ open, onOpenChange, selecionados, onConcluido }) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="rounded-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{TEXTOS_FORECAST.atualizarData}</DialogTitle>
        </DialogHeader>
        {open && (
          <FormData
            onConcluido={onConcluido}
            onFechar={() => onOpenChange(false)}
            selecionados={selecionados}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
