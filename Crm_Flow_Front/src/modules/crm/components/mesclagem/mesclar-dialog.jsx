import { useMemo, useState } from 'react';
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
import { useAuth } from '@/hooks/useAuth';
import { temFeature } from '@/lib/acesso';
import { cn } from '@/lib/utils';
import { CHAVE_SCORE, CONTEXTO, CRM_FEATURES, SITUACOES_LEAD } from '../../constants';
import { useMesclarLeads } from '../../hooks/use-duplicidade';
import { useLead } from '../../hooks/use-lead';
import { useLeadsSearch } from '../../hooks/use-leads-search';
import { camposDoContexto } from '../../lib/contextos';
import { FILTRO_VAZIO } from '../../lib/filtro';
import { tituloDoLead } from '../../lib/layout';
import { LADO, escolhasParaEnvio, ladoQueFica, linhasDaMesclagem } from '../../lib/mesclagem';
import { BuscaLeads } from '../busca-leads';

const RESULTADOS = 10;
const RADIO_CLASS = 'size-4 shrink-0 accent-primary';

/** Passo 1 (pelo menu "⋯"): achar o outro lead pela busca. */
function EscolherOutro({ lead, onEscolher }) {
  const [busca, setBusca] = useState('');
  const resultados = useLeadsSearch({
    busca,
    pagina: 1,
    tamanho: RESULTADOS,
    filtro: FILTRO_VAZIO,
    situacao: SITUACOES_LEAD.ATIVOS,
  });
  // Lead anonimizado não mescla (o back daria 409): fica fora da escolha.
  const outros = (resultados.data?.itens ?? []).filter(
    (item) => item.id !== lead.id && !item.anonimizado_em,
  );

  return (
    <div className="grid gap-3">
      <p className="text-sm">
        Com qual lead mesclar <span className="font-medium">{tituloDoLead(lead)}</span>?
      </p>
      <BuscaLeads
        busca={busca}
        onBuscaChange={setBusca}
        placeholder="Buscar por nome, e-mail ou telefone"
      />
      <ApiErrorAlert error={resultados.error} id="mesclar-busca-erro" />

      {resultados.isPending ? (
        <Skeleton className="h-24 rounded-none" />
      ) : outros.length === 0 ? (
        <p className="text-sm text-muted-foreground" role="status">
          Nenhum outro lead encontrado.
        </p>
      ) : (
        <ul className="max-h-64 overflow-y-auto border border-border">
          {outros.map((item) => (
            <li className="border-b border-border last:border-b-0" key={item.id}>
              <button
                className="grid w-full gap-0.5 px-3 py-2 text-left text-sm outline-none hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/50"
                onClick={() => onEscolher(item)}
                type="button"
              >
                <span className="font-medium">{tituloDoLead(item)}</span>
                <span className="text-xs text-muted-foreground">
                  {[item.email, item.telefone].filter(Boolean).join(' · ') ||
                    'Sem e-mail e telefone'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Célula de um lado: rádio (campo escolhível) ou só o valor. */
function CelulaLado({ linha, lado, texto, fica, onEscolher }) {
  const vazio = <span className="text-muted-foreground">—</span>;

  if (!linha.escolhivel) {
    return <td className={cn('px-3 py-2 align-top', fica && 'font-medium')}>{texto ?? vazio}</td>;
  }

  const id = `mesclar-${linha.chave}-${lado}`;
  return (
    <td className="px-3 py-2 align-top">
      <label className="flex items-start gap-2" htmlFor={id}>
        <input
          checked={fica}
          className={cn(RADIO_CLASS, 'mt-0.5')}
          id={id}
          name={`mesclar-${linha.chave}`}
          onChange={() => onEscolher(lado)}
          type="radio"
        />
        <span className="break-words">{texto}</span>
      </label>
    </td>
  );
}

/** Passo 2: os dois lado a lado, qual fica e, campo a campo, de onde vem o valor. */
function Comparar({ idA, idB, campos, nomePorId, onMesclado }) {
  const leadA = useLead(idA);
  const leadB = useLead(idB);
  const mesclar = useMesclarLeads();
  const [principal, setPrincipal] = useState(LADO.A);
  const [escolhas, setEscolhas] = useState({});

  const a = leadA.data;
  const b = leadB.data;
  const linhas = useMemo(
    () => (a && b ? linhasDaMesclagem(campos, a, b, nomePorId) : []),
    [a, b, campos, nomePorId],
  );

  const erroAoCarregar = leadA.error ?? leadB.error;
  if (erroAoCarregar) {
    return <ApiErrorAlert error={erroAoCarregar} id="mesclar-carregar-erro" />;
  }
  if (!a || !b) {
    return <Skeleton className="h-40 rounded-none" />;
  }

  const porLado = { [LADO.A]: a, [LADO.B]: b };
  const outro = principal === LADO.A ? LADO.B : LADO.A;

  function confirmar() {
    mesclar.mutate(
      {
        principalId: porLado[principal].id,
        secundarioId: porLado[outro].id,
        escolhas: escolhasParaEnvio(escolhas, principal),
      },
      { onSuccess: () => onMesclado(porLado[principal].id) },
    );
  }

  return (
    <div className="grid gap-4">
      <div className="overflow-x-auto border border-border">
        <table className="w-full text-sm">
          <caption className="sr-only">Comparação dos dois leads</caption>
          <thead>
            <tr className="border-b border-border">
              <th
                className="px-3 py-2 text-left font-mono text-[11px] font-normal tracking-wide text-muted-foreground uppercase"
                scope="col"
              >
                Campo
              </th>
              {[LADO.A, LADO.B].map((lado) => (
                <th className="px-3 py-2 text-left font-normal" key={lado} scope="col">
                  <label className="flex items-start gap-2" htmlFor={`mesclar-fica-${lado}`}>
                    <input
                      checked={principal === lado}
                      className={cn(RADIO_CLASS, 'mt-0.5')}
                      id={`mesclar-fica-${lado}`}
                      name="mesclar-principal"
                      onChange={() => setPrincipal(lado)}
                      type="radio"
                    />
                    <span className="grid">
                      <span className="font-medium">{tituloDoLead(porLado[lado])}</span>
                      <span className="text-xs text-muted-foreground">
                        {principal === lado ? 'Fica' : 'Vai para a lixeira'}
                      </span>
                    </span>
                  </label>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-muted-foreground" colSpan={3}>
                  Os dois leads têm os mesmos dados.
                </td>
              </tr>
            ) : (
              linhas.map((linha) => {
                const fica = ladoQueFica(linha, escolhas[linha.chave], principal);
                const escolher = (lado) => {
                  mesclar.reset();
                  setEscolhas((atuais) => ({ ...atuais, [linha.chave]: lado }));
                };

                return (
                  <tr className="border-b border-border last:border-b-0" key={linha.chave}>
                    <th
                      className="px-3 py-2 text-left align-top font-normal text-muted-foreground"
                      scope="row"
                    >
                      {linha.label}
                    </th>
                    <CelulaLado
                      fica={fica === LADO.A}
                      lado={LADO.A}
                      linha={linha}
                      onEscolher={escolher}
                      texto={linha.textoA}
                    />
                    <CelulaLado
                      fica={fica === LADO.B}
                      lado={LADO.B}
                      linha={linha}
                      onEscolher={escolher}
                      texto={linha.textoB}
                    />
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Campo vazio de um lado fica com o valor do outro. Tags são unidas. Atividades e histórico
        vão para o lead que fica; o outro vai para a lixeira e não pode ser restaurado.
      </p>

      <ApiErrorAlert error={mesclar.error} id="mesclar-erro" title="Não foi possível mesclar" />

      <DialogFooter>
        <DialogClose
          render={<Button disabled={mesclar.isPending} type="button" variant="outline" />}
        >
          Cancelar
        </DialogClose>
        <Button aria-busy={mesclar.isPending} disabled={mesclar.isPending} onClick={confirmar}>
          {mesclar.isPending ? 'Mesclando…' : 'Mesclar leads'}
        </Button>
      </DialogFooter>
    </div>
  );
}

/**
 * Mesclar dois leads (`crm.duplicidade`, DONO/MASTER). Com um lead só (menu
 * "⋯"), começa pela busca do outro; com dois (seleção na tabela), vai direto
 * à comparação.
 *
 * @param {{
 *   leads: import('../../types').Lead[],
 *   campos: import('../../types').Campo[],
 *   nomePorId: Map<string, string>,
 *   onOpenChange: (open: boolean) => void,
 *   onMesclado: (principalId: string) => void,
 * }} props aberto enquanto houver `leads`
 */
export function MesclarDialog({ leads, campos, nomePorId, onOpenChange, onMesclado }) {
  const [escolhido, setEscolhido] = useState(null);
  const [primeiro, segundo = escolhido] = leads;
  const { user } = useAuth();
  const comScore = temFeature(user, CRM_FEATURES.SCORE);
  // Com `crm.score`, o back recalcula o score depois de mesclar e ignora a escolha: fora da comparação.
  const camposDaFicha = useMemo(
    () =>
      camposDoContexto(campos, CONTEXTO.FICHA).filter(
        (campo) => !comScore || campo.chave !== CHAVE_SCORE,
      ),
    [campos, comScore],
  );

  function handleOpenChange(aberto) {
    if (!aberto) {
      setEscolhido(null);
    }
    onOpenChange(aberto);
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={leads.length > 0}>
      <DialogContent className="rounded-none sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Mesclar leads</DialogTitle>
          <DialogDescription>Junta dois leads do mesmo contato em um só.</DialogDescription>
        </DialogHeader>
        {primeiro &&
          (segundo ? (
            <Comparar
              campos={camposDaFicha}
              idA={primeiro.id}
              idB={segundo.id}
              key={`${primeiro.id}:${segundo.id}`}
              nomePorId={nomePorId}
              onMesclado={(principalId) => {
                setEscolhido(null);
                onMesclado(principalId);
              }}
            />
          ) : (
            <EscolherOutro lead={primeiro} onEscolher={setEscolhido} />
          ))}
      </DialogContent>
    </Dialog>
  );
}
