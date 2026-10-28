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
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { SCORE } from '../../constants';
import { validarRegraScore } from '../../lib/score';
import { CampoForm } from '../campo-form';
import { ListaCondicoes } from '../lista-condicoes';

/**
 * Montado só com o dialog aberto: parte da regra do rascunho. Os erros do
 * último PUT valem até a primeira mudança.
 */
function FormRegraScore({ regra, campos, errosDoServidor, onConfirmar }) {
  const [valores, setValores] = useState(regra);
  const [errosCliente, setErrosCliente] = useState({});
  const [servidor, setServidor] = useState(errosDoServidor ?? {});
  const erroDe = (caminho) => errosCliente[caminho] ?? servidor[caminho] ?? null;

  function alterar(parcial) {
    setValores((atuais) => ({ ...atuais, ...parcial }));
    setErrosCliente({});
    setServidor({});
  }

  function handleSubmit(event) {
    event.preventDefault();
    const erros = validarRegraScore(valores, campos);
    if (Object.keys(erros).length > 0) {
      setErrosCliente(erros);
      return;
    }
    onConfirmar({ ...valores, nome: valores.nome.trim(), pontos: valores.pontos.trim() });
  }

  const erroGeral = erroDe('item');

  return (
    <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
        <CampoForm erro={erroDe('nome')} id="score-regra-nome" label="Nome da regra" obrigatorio>
          {(controle) => (
            <Input
              {...controle}
              autoFocus
              className="h-9 rounded-none"
              onChange={(event) => alterar({ nome: event.target.value })}
              placeholder="Ex.: Veio do site"
              value={valores.nome}
            />
          )}
        </CampoForm>
        <CampoForm
          ajuda={`De -${SCORE.PONTOS_MAX} a ${SCORE.PONTOS_MAX}`}
          erro={erroDe('pontos')}
          id="score-regra-pontos"
          label="Pontos"
          obrigatorio
        >
          {(controle) => (
            <Input
              {...controle}
              className="h-9 rounded-none font-mono tabular-nums"
              inputMode="numeric"
              onChange={(event) => alterar({ pontos: event.target.value })}
              value={valores.pontos}
            />
          )}
        </CampoForm>
      </div>

      <ListaCondicoes
        campos={campos}
        condicoes={valores.condicoes}
        erroDe={erroDe}
        idBase="score-condicao"
        maximo={SCORE.MAX_CONDICOES}
        onChange={(condicoes) => alterar({ condicoes })}
      />

      <label className="flex items-center gap-2 text-sm" htmlFor="score-regra-ativa">
        <Switch checked={valores.ativo} id="score-regra-ativa" onCheckedChange={(ativo) => alterar({ ativo })} />
        Regra ligada
      </label>

      {erroGeral && (
        <p className="border border-destructive px-3 py-2 text-sm text-destructive" role="alert">
          {erroGeral}
        </p>
      )}

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
        <Button type="submit">Concluir</Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Criar ou editar uma regra de pontuação **no rascunho**: nada é salvo aqui
 * — o "Salvar" da seção manda tudo (e recalcula os leads).
 *
 * @param {{
 *   regra: import('../../lib/score').RegraScoreNoForm | null,
 *   nova: boolean,
 *   campos: import('../../types').Campo[],
 *   errosDoServidor?: Record<string, string>,
 *   onOpenChange: (open: boolean) => void,
 *   onConfirmar: (regra: import('../../lib/score').RegraScoreNoForm) => void,
 * }} props aberto enquanto houver `regra`
 */
export function RegraScoreDialog({ regra, nova, campos, errosDoServidor, onOpenChange, onConfirmar }) {
  return (
    <Dialog onOpenChange={onOpenChange} open={Boolean(regra)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{nova ? 'Nova regra' : 'Editar regra'}</DialogTitle>
          <DialogDescription>
            O lead que casa com as condições soma (ou perde) estes pontos. Salve a pontuação para valer.
          </DialogDescription>
        </DialogHeader>
        {regra && (
          <FormRegraScore
            campos={campos}
            errosDoServidor={errosDoServidor}
            key={regra.chaveLocal}
            onConfirmar={(confirmada) => {
              onOpenChange(false);
              onConfirmar(confirmada);
            }}
            regra={regra}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
