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
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/loading-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { semChave } from '@/lib/objetos';
import { cn } from '@/lib/utils';
import { toApiError } from '@/services/api';
import { useContextoDoForm } from '../../hooks/use-contexto-do-form';
import { useNavegacaoLeads } from '../../hooks/use-navegacao-leads';
import { useBuscaDePessoas, useCriarCard } from '../../hooks/use-quadro';
import { useUsuarios } from '../../hooks/use-usuarios';
import { montarPayloadCriacao } from '../../lib/form-lead';
import {
  acessoAosDados,
  errosDoDialog,
  payloadDaCriacao,
  validarOportunidade,
  valoresDaOportunidade,
} from '../../lib/oportunidades';
import { camposDaPessoaNova } from '../../lib/quadro';
import { CampoForm } from '../campo-form';
import { INPUT_CLASS } from '../campos-texto';
import { LeadForm } from '../lead-form';
import { CamposOportunidade } from '../oportunidades/campos-oportunidade';
import { ErrosDoDialog } from '../oportunidades/erros-do-dialog';

const ABA = Object.freeze({ EXISTENTE: 'existente', NOVA: 'nova' });
const CHAVES_DO_FORM = Object.freeze([
  'leadId',
  'titulo',
  'valor',
  'probabilidadeFechamento',
  'dataPrevistaFechamento',
  'responsavelId',
]);
const AVISO_CRIADO = 'Card criado.';

/** Lista de pessoas: a escolha fica marcada, com `aria-pressed`. */
function ResultadosDaBusca({ termo, escolhida, onEscolher }) {
  const busca = useBuscaDePessoas(termo);
  const pessoas = busca.data?.itens ?? [];

  if (termo.trim().length < 2) {
    return <p className="text-sm text-muted-foreground">Digite ao menos 2 letras.</p>;
  }
  if (busca.isPending) {
    return <LoadingState inline label="Buscando pessoas…" />;
  }
  if (pessoas.length === 0) {
    return <p className="text-sm text-muted-foreground">Ninguém encontrado.</p>;
  }

  return (
    <ul className="grid max-h-40 overflow-y-auto rounded-lg border border-border bg-card">
      {pessoas.map((pessoa) => (
        <li key={pessoa.id}>
          <button
            aria-pressed={escolhida?.id === pessoa.id}
            className={cn(
              'w-full px-3 py-2 text-left text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50',
              escolhida?.id === pessoa.id && 'bg-primary/10 font-medium text-primary',
            )}
            onClick={() => onEscolher(pessoa)}
            type="button"
          >
            {pessoa.nome ?? 'Lead sem nome'}
            {pessoa.email && <span className="text-muted-foreground"> · {pessoa.email}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Pessoa que já existe: ganha uma oportunidade neste pipeline, nesta coluna. */
function FormPessoaExistente({ quadroRef, coluna, campos, onSalvo }) {
  const criar = useCriarCard(quadroRef);
  const { usuarios } = useUsuarios();
  const [termo, setTermo] = useState('');
  const [pessoa, setPessoa] = useState(null);
  const [valores, setValores] = useState(() => valoresDaOportunidade(null));
  const [errosCliente, setErrosCliente] = useState({});
  const acesso = acessoAosDados(campos);
  const apiError = criar.error ? toApiError(criar.error) : null;
  const { porCampo, outros } = errosDoDialog(apiError, CHAVES_DO_FORM);
  const semCampo = Boolean(apiError) && (Object.keys(porCampo).length === 0 || outros.length > 0);

  function alterar(chave, valor) {
    setValores((atuais) => ({ ...atuais, [chave]: valor }));
    setErrosCliente((atuais) => semChave(atuais, chave));
    criar.reset();
  }

  function escolher(escolhida) {
    setPessoa(escolhida);
    setErrosCliente((atuais) => semChave(atuais, 'leadId'));
    // Oportunidade nova herda o dono da pessoa, como na aba da ficha.
    alterar('responsavelId', escolhida.usuario_responsavel_id ?? '');
  }

  function handleSubmit(event) {
    event.preventDefault();
    const erros = {
      ...validarOportunidade(valores),
      ...(!pessoa && { leadId: 'Escolha a pessoa' }),
    };
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

    criar.mutate(
      {
        colunaRef: coluna.ref,
        dados: { leadId: pessoa.id, ...payloadDaCriacao(valores, campos) },
      },
      { onSuccess: () => onSalvo(AVISO_CRIADO) },
    );
  }

  return (
    <Form className="grid gap-4" noValidate onSubmit={handleSubmit}>
      <CampoForm
        erro={errosCliente.leadId ?? porCampo.leadId}
        id="quadro-busca-pessoa"
        label="Pessoa"
        obrigatorio
      >
        {(controle) => (
          <Input
            {...controle}
            autoFocus
            className={INPUT_CLASS}
            onChange={(event) => setTermo(event.target.value)}
            type="search"
            value={termo}
          />
        )}
      </CampoForm>
      <ResultadosDaBusca escolhida={pessoa} onEscolher={escolher} termo={termo} />

      <CamposOportunidade
        acesso={acesso}
        erroDe={(chave) => errosCliente[chave] ?? porCampo[chave]}
        onChange={alterar}
        usuarios={usuarios}
        valores={valores}
      />

      <ErrosDoDialog
        erro={criar.error}
        id="quadro-novo-card-erro"
        mostrar={semCampo}
        outros={outros}
        titulo="Não foi possível criar o card"
      />

      <DialogFooter>
        <DialogClose render={<Button disabled={criar.isPending} type="button" variant="outline" />}>
          Cancelar
        </DialogClose>
        <Button
          aria-busy={criar.isPending}
          disabled={criar.isPending}
          type="submit"
          loading={criar.isPending}
          loadingText="Criando…"
        >
          {'Criar card'}
        </Button>
      </DialogFooter>
    </Form>
  );
}

/**
 * Pessoa nova: o form de Novo lead, com duplicidade e erros por campo. Ela nasce
 * só neste pipeline, e o status é a coluna.
 */
function FormPessoaNova({ quadroRef, coluna, onCancelar, onSalvo }) {
  const criar = useCriarCard(quadroRef);
  const { usuarios } = useUsuarios();
  const { abrirLead } = useNavegacaoLeads();
  const { campos, iniciais, avaliarRegras, comLgpd, distribuicaoLigada, esperando } =
    useContextoDoForm({ criando: true });
  const daPessoa = camposDaPessoaNova(campos);

  if (esperando) {
    return <Skeleton className="h-40" />;
  }

  async function salvar(valores, { ignorarDuplicados = false } = {}) {
    await criar.mutateAsync({
      colunaRef: coluna.ref,
      dados: {
        ...montarPayloadCriacao(daPessoa, valores),
        ...(ignorarDuplicados && { ignorarDuplicados: true }),
      },
    });
    onSalvo(AVISO_CRIADO);
  }

  return (
    <div className="flex max-h-[65vh] flex-col">
      <LeadForm
        avaliarRegras={avaliarRegras}
        campos={daPessoa}
        comLgpd={comLgpd}
        distribuicaoLigada={distribuicaoLigada}
        enviando={criar.isPending}
        iniciais={iniciais}
        modo="criar"
        onAbrirLead={(id) => abrirLead(id)}
        onCancelar={onCancelar}
        onSalvar={salvar}
        usuarios={usuarios}
      />
    </div>
  );
}

/**
 * "Adicionar" da coluna: pessoa que já existe ou pessoa nova. Aberto enquanto
 * houver `coluna`.
 *
 * @param {{
 *   coluna: import('../../api/quadro.api').ColunaQuadro | null,
 *   quadroRef: string,
 *   campos: import('../../types').Campo[],
 *   onFechar: () => void,
 *   onSalvo: (aviso: string) => void,
 * }} props
 */
export function NovoCardDialog({ coluna, quadroRef, campos, onFechar, onSalvo }) {
  const salvo = (aviso) => {
    onFechar();
    onSalvo(aviso);
  };

  return (
    <Dialog onOpenChange={(aberto) => !aberto && onFechar()} open={Boolean(coluna)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar em {coluna?.nome}</DialogTitle>
          <DialogDescription>O card entra nesta coluna, neste pipeline.</DialogDescription>
        </DialogHeader>
        {coluna && (
          <Tabs className="gap-3" defaultValue={ABA.EXISTENTE}>
            <TabsList variant="line">
              <TabsTrigger value={ABA.EXISTENTE}>Pessoa existente</TabsTrigger>
              <TabsTrigger value={ABA.NOVA}>Pessoa nova</TabsTrigger>
            </TabsList>
            <TabsContent value={ABA.EXISTENTE}>
              <FormPessoaExistente
                campos={campos}
                coluna={coluna}
                onSalvo={salvo}
                quadroRef={quadroRef}
              />
            </TabsContent>
            <TabsContent value={ABA.NOVA}>
              <FormPessoaNova
                coluna={coluna}
                onCancelar={onFechar}
                onSalvo={salvo}
                quadroRef={quadroRef}
              />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
