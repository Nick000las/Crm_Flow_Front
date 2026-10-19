import { Link, Navigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/page-header';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { SecaoCampos } from '../components/config-campos/secao-campos';
import { SecaoCnpj } from '../components/config-cnpj/secao-cnpj';
import { SecaoDuplicidade } from '../components/config-duplicidade/secao-duplicidade';
import { SecaoInatividade } from '../components/config-inatividade/secao-inatividade';
import { SecaoLayout } from '../components/config-layout/secao-layout';
import { SecaoListas } from '../components/config-listas/secao-listas';
import { SecaoRegras } from '../components/config-regras/secao-regras';
import { caminhoDaSecao, secoesVisiveis } from '../lib/secoes-configuracoes';
import { ROTAS_CRM } from '../rotas';

/** Tela de cada subseção pronta. Subseção nova = uma entrada aqui + `pronta` no lib. */
const TELA_DA_SECAO = Object.freeze({
  layout: SecaoLayout,
  campos: SecaoCampos,
  listas: SecaoListas,
  regras: SecaoRegras,
  duplicidade: SecaoDuplicidade,
  inatividade: SecaoInatividade,
  enriquecimento: SecaoCnpj,
});

function NavegacaoSecoes({ secoes, ativa }) {
  return (
    <nav aria-label="Seções de configuração" className="md:w-48 md:shrink-0">
      <ul className="flex gap-1 overflow-x-auto md:grid">
        {secoes.map((secao) => {
          const atual = secao.key === ativa;

          return (
            <li key={secao.key}>
              <Link
                aria-current={atual ? 'page' : undefined}
                className={cn(
                  'block border-l-2 px-3 py-1.5 text-sm whitespace-nowrap outline-none transition-colors duration-200',
                  'focus-visible:ring-2 focus-visible:ring-ring/50',
                  atual
                    ? 'border-primary font-medium text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
                to={caminhoDaSecao(secao.key)}
              >
                {secao.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Área Configurações do CRM (`/crm/configuracoes/:secao`). Papel e flag
 * valem por subseção (`secoesVisiveis`): o OPERADOR, por exemplo, só vê o
 * Layout. Sem `:secao`, ou com uma que o usuário não vê, vai para a primeira
 * visível; sem nenhuma, volta para a lista.
 */
export default function ConfiguracoesCrmPage() {
  const { secao } = useParams();
  const { user } = useAuth();
  const secoes = secoesVisiveis(user);
  const atual = secoes.find((item) => item.key === secao);

  if (!atual) {
    const destino = secoes[0] ? caminhoDaSecao(secoes[0].key) : ROTAS_CRM.LISTA;
    return <Navigate replace to={destino} />;
  }

  const Tela = TELA_DA_SECAO[atual.key];

  return (
    <>
      <PageHeader title="Configurações" description="Como o CRM funciona para a sua empresa." />

      <div className="flex flex-col gap-6 md:flex-row">
        <NavegacaoSecoes ativa={atual.key} secoes={secoes} />
        <section aria-labelledby="config-secao-titulo" className="min-w-0 flex-1">
          <h2 className="mb-4 text-base font-semibold" id="config-secao-titulo">
            {atual.label}
          </h2>
          <Tela />
        </section>
      </div>
    </>
  );
}
