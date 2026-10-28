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
import { DISTRIBUICAO } from '../../constants';
import { validarRegraDistribuicao } from '../../lib/distribuicao';
import { CampoForm } from '../campo-form';
import { ListaCondicoes } from '../lista-condicoes';
import { SelectSimples } from '../select-simples';

/**
 * Montado só com o dialog aberto: parte da regra do rascunho. Os erros do
 * último PUT valem até a primeira mudança.
 */
function FormRegraDistribuicao({ regra, campos, opcoesDestino, errosDoServidor, onConfirmar }) {
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
    const erros = validarRegraDistribuicao(valores, campos);
    if (Object.keys(erros).length > 0) {
      setErrosCliente(erros);
      return;
    }
    onConfirmar({ ...valores, nome: valores.nome.trim() });
  }

  const erroGeral = erroDe('regra') ?? erroDe('id');

  return (
    <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
      <CampoForm erro={erroDe('nome')} id="distribuicao-regra-nome" label="Nome da regra" obrigatorio>
        {(controle) => (
          <Input
            {...controle}
            autoFocus
            className="h-9 rounded-none"
            onChange={(event) => alterar({ nome: event.target.value })}
            placeholder="Ex.: Leads do site"
            value={valores.nome}
          />
        )}
      </CampoForm>

      <ListaCondicoes
        campos={campos}
        condicoes={valores.condicoes}
        erroDe={erroDe}
        idBase="distribuicao-condicao"
        maximo={DISTRIBUICAO.MAX_CONDICOES}
        onChange={(condicoes) => alterar({ condicoes })}
      />

      <CampoForm erro={erroDe('destino')} id="distribuicao-regra-destino" label="Vai para" obrigatorio>
        {(controle) => (
          <SelectSimples
            {...controle}
            onChange={(destino) => alterar({ destino })}
            opcoes={opcoesDestino}
            placeholder="Escolha um usuário ou grupo"
            value={valores.destino}
          />
        )}
      </CampoForm>

      <label className="flex items-center gap-2 text-sm" htmlFor="distribuicao-regra-ativa">
        <Switch checked={valores.ativo} id="distribuicao-regra-ativa" onCheckedChange={(ativo) => alterar({ ativo })} />
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
 * Criar ou editar uma regra de distribuição **no rascunho**: nada é salvo
 * aqui — o "Salvar" da seção manda a configuração inteira.
 *
 * @param {{
 *   regra: import('../../lib/distribuicao').RegraNoForm | null,
 *   nova: boolean,
 *   campos: import('../../types').Campo[],
 *   opcoesDestino: { valor: string, rotulo: string }[],
 *   errosDoServidor?: Record<string, string>,
 *   onOpenChange: (open: boolean) => void,
 *   onConfirmar: (regra: import('../../lib/distribuicao').RegraNoForm) => void,
 * }} props aberto enquanto houver `regra`
 */
export function RegraDistribuicaoDialog({
  regra,
  nova,
  campos,
  opcoesDestino,
  errosDoServidor,
  onOpenChange,
  onConfirmar,
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={Boolean(regra)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{nova ? 'Nova regra' : 'Editar regra'}</DialogTitle>
          <DialogDescription>
            Quem recebe os leads novos que casam com as condições. Salve a distribuição para valer.
          </DialogDescription>
        </DialogHeader>
        {regra && (
          <FormRegraDistribuicao
            campos={campos}
            errosDoServidor={errosDoServidor}
            key={regra.chaveLocal}
            onConfirmar={(confirmada) => {
              onOpenChange(false);
              onConfirmar(confirmada);
            }}
            opcoesDestino={opcoesDestino}
            regra={regra}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
