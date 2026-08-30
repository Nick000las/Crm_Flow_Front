import { RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AcessoIndisponivel } from '@/components/acesso-indisponivel';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { podeVer } from '@/lib/acesso';
import { isAccessError } from '@/services/api';
import { CONTEXTO, PAPEIS_GESTAO } from '../../constants';
import { useCampos } from '../../hooks/use-campos';
import { useLayout } from '../../hooks/use-layout';
import { camposDoContexto } from '../../lib/contextos';
import { MODO, identificadorPermitido, layoutDoEditor, opcoesDoEditor } from '../../lib/layout';
import { FormLayout } from './form-layout';
import { VoltarPadraoDialog } from './voltar-padrao-dialog';

const DESCRICAO_MODO = Object.freeze({
  [MODO.PADRAO]: 'Vale para todos da empresa que não personalizaram o próprio layout.',
  [MODO.MEU]: 'Só você vê. O que você não mudar segue o padrão da empresa.',
});
const CAMPOS_VAZIOS = [];

function Carregando() {
  return (
    <div className="grid gap-3" aria-busy="true">
      <span className="sr-only" role="status">
        Carregando layout…
      </span>
      {Array.from({ length: 4 }, (_, indice) => (
        <Skeleton className="h-16 rounded-none" key={indice} />
      ))}
    </div>
  );
}

/** O que cada parte do editor oferece, a partir de `/fields` (pelo `id`). */
function useOpcoesDoEditor() {
  const camposQuery = useCampos();
  const campos = camposQuery.data ?? CAMPOS_VAZIOS;

  return useMemo(() => {
    const naFicha = camposDoContexto(campos, CONTEXTO.FICHA);
    return {
      identificador: naFicha
        .filter(identificadorPermitido)
        .map((campo) => ({ valor: campo.id, rotulo: campo.label })),
      ficha: opcoesDoEditor(naFicha),
      tabela: opcoesDoEditor(camposDoContexto(campos, CONTEXTO.TABELA)),
    };
  }, [campos]);
}

/**
 * Configurações › Layout do lead. DONO/MASTER editam o padrão da empresa e
 * o próprio; OPERADOR, só o próprio (o back barra o padrão com 403). Todos
 * têm "Voltar ao padrão" quando há um layout próprio.
 */
export function SecaoLayout() {
  const { user } = useAuth();
  const gestao = podeVer({ roles: PAPEIS_GESTAO }, user);
  const layoutQuery = useLayout();
  const opcoes = useOpcoesDoEditor();
  const [modo, setModo] = useState(gestao ? MODO.PADRAO : MODO.MEU);
  const [voltando, setVoltando] = useState(false);
  const [aviso, setAviso] = useState(null);

  if (isAccessError(layoutQuery.error)) {
    return <AcessoIndisponivel error={layoutQuery.error} />;
  }
  if (layoutQuery.error) {
    return <ApiErrorAlert error={layoutQuery.error} id="config-layout-carregar-erro" />;
  }
  if (layoutQuery.isPending) {
    return <Carregando />;
  }

  const { padrao, padraoConfigurado, meu, efetivo } = layoutQuery.data;
  const base = layoutDoEditor(modo === MODO.PADRAO ? padrao : efetivo);
  const automatica = efetivo.secoes.find((secao) => secao.automatica) ?? null;

  const formulario = (
    <FormLayout
      automatica={automatica}
      base={base}
      key={`${modo}:${JSON.stringify(base)}`}
      modo={modo}
      onSalvo={setAviso}
      opcoes={opcoes}
    />
  );

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1 text-sm text-muted-foreground">
          <p>
            Como o lead aparece na tabela e no drawer: título, subtítulo, destaques, seções e
            colunas.
          </p>
          {!padraoConfigurado && <p>A empresa ainda usa o layout inicial do CRM.</p>}
        </div>
        {meu && (
          <Button
            onClick={() => {
              setAviso(null);
              setVoltando(true);
            }}
            variant="outline"
          >
            <RotateCcw aria-hidden="true" />
            Voltar ao padrão
          </Button>
        )}
      </div>

      <p className={aviso ? 'border border-border px-3 py-2 text-sm' : 'sr-only'} role="status">
        {aviso}
      </p>

      {gestao ? (
        <Tabs
          onValueChange={(proximo) => {
            setAviso(null);
            setModo(proximo);
          }}
          value={modo}
        >
          <TabsList className="mb-2" variant="line">
            <TabsTrigger value={MODO.PADRAO}>Padrão da empresa</TabsTrigger>
            <TabsTrigger value={MODO.MEU}>Só para mim</TabsTrigger>
          </TabsList>
          <TabsContent className="grid gap-4" value={modo}>
            <p className="text-sm text-muted-foreground">{DESCRICAO_MODO[modo]}</p>
            {formulario}
          </TabsContent>
        </Tabs>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{DESCRICAO_MODO[MODO.MEU]}</p>
          {formulario}
        </>
      )}

      <VoltarPadraoDialog
        onOpenChange={setVoltando}
        onRestaurado={() => setAviso('Você voltou ao padrão da empresa.')}
        open={voltando}
      />
    </div>
  );
}
