import { useSearchParams } from 'react-router-dom';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CamposPersonalizadosTab } from '../components/campos-personalizados-tab';
import { CamposSistemaTab } from '../components/campos-sistema-tab';
import { useCampos } from '../hooks/use-campos';
import { useDefinicoes, useVisibilidade } from '../hooks/use-campos-config';

const ABA = Object.freeze({ SISTEMA: 'sistema', PERSONALIZADOS: 'personalizados' });
const PARAM_ABA = 'aba';
const LINHAS_SKELETON = 6;

function Carregando() {
  return (
    <div className="grid gap-2" aria-busy="true">
      <span className="sr-only" role="status">Carregando campos…</span>
      {Array.from({ length: LINHAS_SKELETON }, (_, indice) => (
        <Skeleton className="h-9 rounded-none" key={indice} />
      ))}
    </div>
  );
}

/** Estado de uma query como conteúdo da aba. */
function ConteudoDaQuery({ query, erroId, children }) {
  if (query.error) return <ApiErrorAlert error={query.error} id={erroId} />;
  if (query.isPending) return <Carregando />;
  return children(query.data);
}

/**
 * Configuração de campos do lead (DONO/MASTER — a rota já barra o resto).
 * A aba fica na URL (`?aba=`) para dar link direto.
 */
export default function CamposPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const aba = searchParams.get(PARAM_ABA) === ABA.PERSONALIZADOS ? ABA.PERSONALIZADOS : ABA.SISTEMA;
  const visibilidadeQuery = useVisibilidade();
  const definicoesQuery = useDefinicoes();
  const camposQuery = useCampos();

  return (
    <>
      <PageHeader title="Campos" description="O que aparece no formulário, nos filtros e na tabela de leads." />

      <Tabs
        onValueChange={(proxima) =>
          setSearchParams(proxima === ABA.SISTEMA ? {} : { [PARAM_ABA]: proxima }, { replace: true })
        }
        value={aba}
      >
        <TabsList className="mb-6" variant="line">
          <TabsTrigger value={ABA.SISTEMA}>Campos do sistema</TabsTrigger>
          <TabsTrigger value={ABA.PERSONALIZADOS}>Campos personalizados</TabsTrigger>
        </TabsList>

        <TabsContent value={ABA.SISTEMA}>
          <ConteudoDaQuery erroId="campos-sistema-carregar-erro" query={visibilidadeQuery}>
            {(visibilidade) => <CamposSistemaTab visibilidade={visibilidade} />}
          </ConteudoDaQuery>
        </TabsContent>

        <TabsContent value={ABA.PERSONALIZADOS}>
          <ConteudoDaQuery erroId="campos-personalizados-carregar-erro" query={definicoesQuery}>
            {(definicoes) => (
              <CamposPersonalizadosTab campos={camposQuery.data ?? []} definicoes={definicoes} />
            )}
          </ConteudoDaQuery>
        </TabsContent>
      </Tabs>
    </>
  );
}
