/**
 * @file Área Configurações do CRM (`/crm/configuracoes/:secao`). Papel e flag valem por
 * subseção (`secoesVisiveis`): o OPERADOR, por exemplo, só vê o Layout. Sem `:secao`, ou com
 * uma que o usuário não vê, vai para a primeira visível; sem nenhuma, volta para a lista.
 */
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';

import { PageHeader } from '@/components/page-header';
import { NativeSelect } from '@/components/ui/native-select';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

import { SecaoCampos } from '../components/config-campos/secao-campos';
import { SecaoCnpj } from '../components/config-cnpj/secao-cnpj';
import { SecaoDistribuicao } from '../components/config-distribuicao/secao-distribuicao';
import { SecaoDuplicidade } from '../components/config-duplicidade/secao-duplicidade';
import { SecaoFormularios } from '../components/config-formularios/secao-formularios';
import { SecaoInatividade } from '../components/config-inatividade/secao-inatividade';
import { SecaoLayout } from '../components/config-layout/secao-layout';
import { SecaoLgpd } from '../components/config-lgpd/secao-lgpd';
import { SecaoListas } from '../components/config-listas/secao-listas';
import { SecaoPermissoes } from '../components/config-permissoes/secao-permissoes';
import { SecaoPipelines } from '../components/config-pipelines/secao-pipelines';
import { SecaoRegras } from '../components/config-regras/secao-regras';
import { SecaoScore } from '../components/config-score/secao-score';
import { caminhoDaSecao, secoesVisiveis } from '../lib/secoes-configuracoes';
import { ROTAS_CRM } from '../rotas';

/** Tela de cada subseção pronta. Subseção nova = uma entrada aqui + `pronta` no lib. */
const TELA_DA_SECAO = Object.freeze({
  layout: SecaoLayout,
  campos: SecaoCampos,
  listas: SecaoListas,
  pipelines: SecaoPipelines,
  regras: SecaoRegras,
  permissoes: SecaoPermissoes,
  duplicidade: SecaoDuplicidade,
  distribuicao: SecaoDistribuicao,
  inatividade: SecaoInatividade,
  pontuacao: SecaoScore,
  enriquecimento: SecaoCnpj,
  privacidade: SecaoLgpd,
  formularios: SecaoFormularios,
});

const GRUPOS_SECOES = [
  { label: 'Estrutura', keys: ['layout', 'campos', 'listas'] },
  {
    label: 'Pipeline e automação',
    keys: ['pipelines', 'regras', 'distribuicao', 'inatividade', 'pontuacao'],
  },
  {
    label: 'Governança e dados',
    keys: ['permissoes', 'duplicidade', 'enriquecimento', 'privacidade'],
  },
  { label: 'Captação', keys: ['formularios'] },
];

function agruparSecoes(secoes) {
  const porChave = new Map(secoes.map((s) => [s.key, s]));
  const usadas = new Set();
  const grupos = GRUPOS_SECOES.map((grupo) => {
    const itens = grupo.keys.map((key) => porChave.get(key)).filter(Boolean);

    itens.forEach((item) => usadas.add(item.key));

    return { label: grupo.label, itens };
  }).filter((grupo) => grupo.itens.length > 0);
  const restantes = secoes.filter((s) => !usadas.has(s.key));

  if (restantes.length > 0) {
    grupos.push({ label: 'Outras', itens: restantes });
  }

  return grupos;
}

function NavegacaoSecoes({ secoes, ativa }) {
  const navigate = useNavigate();
  const grupos = agruparSecoes(secoes);

  return (
    <nav
      aria-label="Seções de configuração"
      data-tour="crm-settings-nav"
      className="min-w-0 max-w-full xl:w-52 xl:shrink-0"
    >
      <div className="xl:hidden">
        <NativeSelect
          aria-label="Seção de configuração do CRM"
          onChange={(event) => navigate(caminhoDaSecao(event.target.value))}
          value={ativa}
        >
          {grupos.map((grupo) => (
            <optgroup key={grupo.label} label={grupo.label}>
              {grupo.itens.map((secao) => (
                <option key={secao.key} value={secao.key}>
                  {secao.label}
                </option>
              ))}
            </optgroup>
          ))}
        </NativeSelect>
      </div>

      <div className="hidden gap-4 xl:grid">
        {grupos.map((grupo) => (
          <div key={grupo.label} className="grid gap-1">
            <p className="px-3 text-[11px] font-semibold tracking-wider text-muted-foreground/80 uppercase">
              {grupo.label}
            </p>
            <ul className="grid gap-0.5">
              {grupo.itens.map((secao) => {
                const atual = secao.key === ativa;

                return (
                  <li key={secao.key}>
                    <Link
                      aria-current={atual ? 'page' : undefined}
                      className={cn(
                        'block rounded-r-md border-l-2 px-3 py-1.5 text-sm outline-none transition-colors duration-150',
                        'focus-visible:ring-2 focus-visible:ring-ring/50',
                        atual
                          ? 'border-primary bg-primary/[0.06] font-medium text-foreground'
                          : 'border-transparent text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                      )}
                      to={caminhoDaSecao(secao.key)}
                    >
                      {secao.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
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
      <PageHeader
        eyebrow="CRM"
        title="Configurações"
        description="Como o CRM funciona para a sua empresa."
      />

      <div className="flex min-w-0 flex-col gap-6 xl:flex-row">
        <NavegacaoSecoes ativa={atual.key} secoes={secoes} />
        <section
          aria-labelledby="config-secao-titulo"
          data-tour="crm-settings-content"
          className="min-w-0 flex-1"
        >
          <h2 className="mb-4 text-base font-semibold" id="config-secao-titulo">
            {atual.label}
          </h2>
          <Tela />
        </section>
      </div>
    </>
  );
}
