import { useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getFieldError } from '@/services/api';
import { CATEGORIAS_STATUS, ROTULOS_CATEGORIA, ROTULOS_TIPO_REGRA, TIPOS_REGRA } from '../../constants';
import { useCriarRegra, useEditarRegra } from '../../hooks/use-regras';
import { ROTULOS_OPERADOR, operadoresDoCampo, trocarOperador } from '../../lib/filtro';
import { condicaoDoCampo, payloadDaRegra, validarRegra, valoresDaRegra } from '../../lib/regras';
import { CampoForm } from '../campo-form';
import { SelectSimples } from '../select-simples';
import { ValorDoFiltro } from '../valor-do-filtro';

const CAMPOS_DO_SERVIDOR = ['campoId', 'condicao', 'condicao.campoId', 'condicao.operador', 'condicao.valor', 'efeito'];
const CATEGORIAS = Object.values(CATEGORIAS_STATUS);

/** Grupo de checkboxes `{ valor, rotulo }` que edita uma lista de valores. */
function Marcaveis({ id, itens, marcados, onChange }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {itens.map((item) => {
        const itemId = `${id}-${item.valor}`;
        return (
          <label className="flex items-center gap-2 text-sm" htmlFor={itemId} key={item.valor}>
            <Checkbox
              checked={marcados.includes(item.valor)}
              id={itemId}
              onCheckedChange={(marcado) =>
                onChange(marcado ? [...marcados, item.valor] : marcados.filter((atual) => atual !== item.valor))
              }
            />
            {item.rotulo}
          </label>
        );
      })}
    </div>
  );
}

function CondicaoPorStatus({ valores, statusDoTenant, erro, onChange }) {
  return (
    <CampoForm comoGrupo erro={erro} id="regra-status" label="Quando o status for" obrigatorio>
      {() => (
        <div className="grid gap-3">
          <Marcaveis
            id="regra-status"
            itens={statusDoTenant}
            marcados={valores.status}
            onChange={(status) => onChange({ status })}
          />
          <p className="text-xs text-muted-foreground">Ou qualquer status da categoria:</p>
          <Marcaveis
            id="regra-categoria"
            itens={CATEGORIAS.map((valor) => ({ valor, rotulo: ROTULOS_CATEGORIA[valor] }))}
            marcados={valores.categorias}
            onChange={(categorias) => onChange({ categorias })}
          />
        </div>
      )}
    </CampoForm>
  );
}

function CondicaoDeCampo({ valores, campos, erroDe, onChange }) {
  const { condicao } = valores;
  const campo = campos.find((atual) => atual.id === condicao.campoId);
  const opcoesCampo = campos
    .filter((atual) => atual.id !== valores.campoId)
    .map((atual) => ({ valor: atual.id, rotulo: atual.label }));
  const opcoesOperador = campo
    ? operadoresDoCampo(campo).map((operador) => ({ valor: operador, rotulo: ROTULOS_OPERADOR[operador] }))
    : [];

  return (
    <fieldset className="grid gap-3">
      <legend className="mb-1.5 text-sm font-medium">Condição</legend>
      <CampoForm erro={erroDe('condicao.campoId')} id="regra-condicao-campo" label="Quando o campo" obrigatorio>
        {(controle) => (
          <SelectSimples
            {...controle}
            onChange={(id) => onChange({ condicao: condicaoDoCampo(campos.find((atual) => atual.id === id)) })}
            opcoes={opcoesCampo}
            value={condicao.campoId}
          />
        )}
      </CampoForm>
      {campo && (
        <div className="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <CampoForm erro={erroDe('condicao.operador')} id="regra-condicao-operador" label="Operador">
            {(controle) => (
              <SelectSimples
                {...controle}
                onChange={(operador) => onChange({ condicao: trocarOperador(condicao, operador, campo) })}
                opcoes={opcoesOperador}
                value={condicao.operador}
              />
            )}
          </CampoForm>
          <CampoForm erro={erroDe('condicao.valor')} id="regra-condicao-valor" label="Valor">
            {(controle) => (
              <ValorDoFiltro
                campo={campo}
                controle={controle}
                onChange={(valor) => onChange({ condicao: { ...condicao, valor } })}
                operador={condicao.operador}
                rotulo={campo.label}
                value={condicao.valor}
              />
            )}
          </CampoForm>
        </div>
      )}
    </fieldset>
  );
}

function Efeitos({ valores, erro, onChange }) {
  return (
    <CampoForm comoGrupo erro={erro} id="regra-efeito" label="Então o campo" obrigatorio>
      {() => (
        <div className="grid gap-2">
          <label className="flex items-center gap-2 text-sm" htmlFor="regra-efeito-obrigatorio">
            <Checkbox
              checked={valores.obrigatorio}
              id="regra-efeito-obrigatorio"
              onCheckedChange={(marcado) => onChange({ obrigatorio: Boolean(marcado) })}
            />
            Fica obrigatório
          </label>
          <label className="flex items-center gap-2 text-sm" htmlFor="regra-efeito-visivel">
            <Checkbox
              checked={valores.visivel}
              id="regra-efeito-visivel"
              onCheckedChange={(marcado) => onChange({ visivel: Boolean(marcado) })}
            />
            Só aparece quando a condição vale
          </label>
        </div>
      )}
    </CampoForm>
  );
}

/** Montado só com o dialog aberto: cada abertura parte da regra atual. */
function FormRegra({ regra, campos, onSalvo }) {
  const editando = Boolean(regra);
  const [valores, setValores] = useState(() => valoresDaRegra(regra, campos));
  const [errosCliente, setErrosCliente] = useState({});
  const criar = useCriarRegra();
  const editar = useEditarRegra();
  const mutacao = editando ? editar : criar;

  const comId = campos.filter((campo) => campo.id);
  const doStatus = comId.find((campo) => campo.chave === 'status');
  const statusDoTenant = (doStatus?.opcoesLista ?? []).map((opcao) => ({ valor: opcao.key, rotulo: opcao.label }));
  const opcoesAlvo = comId
    .filter((campo) => valores.kind !== TIPOS_REGRA.POR_STATUS || campo !== doStatus)
    .map((campo) => ({ valor: campo.id, rotulo: campo.label }));

  const erroDe = (campo) => errosCliente[campo] ?? (mutacao.error ? getFieldError(mutacao.error, campo) : null);
  const erroSemCampo = mutacao.error && !CAMPOS_DO_SERVIDOR.some((campo) => getFieldError(mutacao.error, campo));

  function alterar(parcial) {
    setValores((atuais) => ({ ...atuais, ...parcial }));
    setErrosCliente({});
    if (mutacao.error) mutacao.reset();
  }

  function handleSubmit(event) {
    event.preventDefault();
    const erros = validarRegra(valores, comId);
    if (Object.keys(erros).length > 0) {
      setErrosCliente(erros);
      return;
    }

    const corpo = payloadDaRegra(valores, comId, regra);
    if (!corpo) {
      onSalvo(null);
      return;
    }
    if (editando) editar.mutate({ id: regra.id, parcial: corpo }, { onSuccess: () => onSalvo('Regra atualizada.') });
    else criar.mutate(corpo, { onSuccess: () => onSalvo('Regra criada.') });
  }

  const corpo = (
    <div className="grid gap-4">
      <CampoForm erro={erroDe('campoId')} id="regra-campo" label="Campo afetado" obrigatorio>
        {(controle) => (
          <SelectSimples
            {...controle}
            onChange={(campoId) => alterar({ campoId })}
            opcoes={opcoesAlvo}
            value={valores.campoId}
          />
        )}
      </CampoForm>

      {valores.kind === TIPOS_REGRA.POR_STATUS ? (
        <CondicaoPorStatus
          erro={erroDe('condicao')}
          onChange={alterar}
          statusDoTenant={statusDoTenant}
          valores={valores}
        />
      ) : (
        <>
          <CondicaoDeCampo campos={comId} erroDe={erroDe} onChange={alterar} valores={valores} />
          <Efeitos erro={erroDe('efeito')} onChange={alterar} valores={valores} />
        </>
      )}
    </div>
  );

  return (
    <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
      {editando ? (
        corpo
      ) : (
        // Na criação, o tipo é uma aba; o painel é o resto do form.
        <Tabs
          onValueChange={(kind) => {
            setErrosCliente({});
            mutacao.reset();
            setValores({ ...valoresDaRegra(null, comId, kind), campoId: valores.campoId });
          }}
          value={valores.kind}
        >
          <TabsList aria-label="Tipo da regra" className="mb-2" variant="line">
            {Object.values(TIPOS_REGRA).map((kind) => (
              <TabsTrigger key={kind} value={kind}>
                {ROTULOS_TIPO_REGRA[kind]}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={valores.kind}>{corpo}</TabsContent>
        </Tabs>
      )}

      {erroSemCampo && <ApiErrorAlert error={mutacao.error} id="regra-erro" title="Não foi possível salvar a regra" />}

      <DialogFooter>
        <DialogClose render={<Button disabled={mutacao.isPending} type="button" variant="outline" />}>
          Cancelar
        </DialogClose>
        <Button aria-busy={mutacao.isPending} disabled={mutacao.isPending} type="submit">
          {mutacao.isPending ? 'Salvando…' : editando ? 'Salvar alterações' : 'Criar regra'}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Criar ou editar uma regra de campo. Na edição o tipo não muda (o back
 * não aceita); a regra do sistema não chega aqui (só liga/desliga na lista).
 *
 * @param {{
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   regra?: import('../../lib/regras').Regra | null,
 *   campos: import('../../types').Campo[],
 *   onSalvo: (aviso: string | null) => void,
 * }} props `onSalvo(null)` = nada mudou
 */
export function RegraDialog({ open, onOpenChange, regra, campos, onSalvo }) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="rounded-none sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{regra ? 'Editar regra' : 'Nova regra'}</DialogTitle>
          <DialogDescription>
            {regra ? ROTULOS_TIPO_REGRA[regra.kind] : 'Quando um campo fica obrigatório ou aparece no formulário do lead.'}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <FormRegra
            campos={campos}
            key={regra?.id ?? 'nova'}
            onSalvo={(aviso) => {
              onOpenChange(false);
              onSalvo(aviso);
            }}
            regra={regra}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
