/**
 * @file Forecast (FC2/FC3, `crm.forecast`).
 */
import { useState } from 'react';
import { Outlet, useSearchParams } from 'react-router-dom';

import { PageHeader } from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';

import { ForecastAssertividade } from '../components/forecast/forecast-assertividade';
import { ForecastPrevisao } from '../components/forecast/forecast-previsao';
import { ABAS_FORECAST } from '../constants';
import { abaDaUrl, abasVisiveis, escreverAba } from '../lib/forecast-abas';
import { TEXTOS_FORECAST } from '../lib/forecast-textos';
import { ROTAS_CRM } from '../rotas';

/**
 * Forecast (FC2/FC3, `crm.forecast`). Duas abas na URL (`?aba=`): Previsão,
 * de todos, e Assertividade, só da gestão (`lib/forecast-abas.js`, por
 * `podeVer`). Sem acesso à aba, `abaDaUrl` cai em Previsão: a rota fica
 * escondida. Só a aba aberta é montada, então só ela busca. Trocar de aba
 * limpa os params da outra (`escreverAba`). A ficha abre por cima, em rota
 * filha (`baseDoLead`).
 */
export default function ForecastPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  // 403 FORBIDDEN na Assertividade (papel mudou depois do login): some até recarregar.
  const [semAssertividade, setSemAssertividade] = useState(false);
  const abas = abasVisiveis(user).filter(
    (definicao) => !semAssertividade || definicao.valor !== ABAS_FORECAST.ASSERTIVIDADE,
  );
  const aba = semAssertividade ? ABAS_FORECAST.PREVISAO : abaDaUrl(searchParams, user);

  const trocarAba = (proxima) => setSearchParams((atuais) => escreverAba(atuais, proxima));

  function esconderAssertividade() {
    setSemAssertividade(true);
    trocarAba(ABAS_FORECAST.PREVISAO);
  }

  return (
    <>
      <PageHeader
        eyebrow="CRM"
        description={TEXTOS_FORECAST.subtitulo}
        title={TEXTOS_FORECAST.titulo}
      />

      {abas.length > 1 ? (
        <Tabs className="gap-6" onValueChange={trocarAba} value={aba}>
          <TabsList variant="line" data-tour="crm-forecast-tabs">
            {abas.map((definicao) => (
              <TabsTrigger key={definicao.valor} value={definicao.valor}>
                {definicao.rotulo}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={ABAS_FORECAST.PREVISAO}>
            {aba === ABAS_FORECAST.PREVISAO && <ForecastPrevisao />}
          </TabsContent>
          <TabsContent value={ABAS_FORECAST.ASSERTIVIDADE}>
            {aba === ABAS_FORECAST.ASSERTIVIDADE && (
              <ForecastAssertividade onOculta={esconderAssertividade} />
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <ForecastPrevisao />
      )}

      <Outlet context={{ baseDoLead: ROTAS_CRM.FORECAST }} />
    </>
  );
}
