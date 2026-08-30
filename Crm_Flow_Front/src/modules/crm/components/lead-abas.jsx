/**
 * @file Corpo do drawer no modo de ver: Dados e Oportunidades sempre (M2.5, sem flag);
 * Atividades e Histórico com `crm.atividades`; Formulários com `crm.formularios` (qualquer
 * papel), com os alertas não vistos (FM5) acima das abas; "Projetos" só com cards ligados ao
 * lead.
 */
import { useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useProjetosDoLead } from '../hooks/use-projetos-do-lead';
import { ABAS_LEAD as ABA } from '../rotas';
import { AbaAtividades } from './atividades/aba-atividades';
import { AbaFormularios } from './formularios-da-pessoa/aba-formularios';
import { AlertasDaPessoa } from './formularios-da-pessoa/alertas-da-pessoa';
import { AbaHistorico } from './historico/aba-historico';
import { LeadDetalhe } from './lead-detalhe';
import { AbaOportunidades } from './oportunidades/aba-oportunidades';
import { AbaProjetos } from './projetos/aba-projetos';

const PAINEL_CLASS = 'min-h-0 overflow-y-auto px-4 pb-4';

/**
 * Corpo do drawer no modo de ver: Dados e Oportunidades sempre (M2.5, sem
 * flag); Atividades e Histórico com `crm.atividades`; Formulários com
 * `crm.formularios` (qualquer papel), com os alertas não vistos (FM5) acima das
 * abas; "Projetos" só com cards ligados ao lead. Só a aba aberta monta (e busca).
 *
 * @param {{
 *   abaInicial?: string,
 *   comAtividades: boolean,
 *   comFormularios?: boolean,
 *   lead: import('../types').Lead,
 *   campos: import('../types').Campo[],
 *   layout: import('../lib/layout').LayoutEfetivo | null,
 *   nomePorId: Map<string, string>,
 * }} props
 */
export function LeadAbas({
  abaInicial = ABA.DADOS,
  comAtividades,
  comFormularios = false,
  lead,
  campos,
  layout,
  nomePorId,
}) {
  const [aba, setAba] = useState(abaInicial);
  // Resposta de formulário aberta: a aba Formulários e o histórico abrem uma.
  const [respostaAberta, setRespostaAberta] = useState(null);

  function abrirResposta(respostaId) {
    setRespostaAberta(respostaId);

    if (respostaId) {
      setAba(ABA.FORMULARIOS);
    }
  }

  const projetos = useProjetosDoLead(lead.id);
  const comProjetos = projetos.length > 0;

  // A lista pode esvaziar com a aba aberta (vínculo removido em outra tela).
  const abaAtual = aba === ABA.PROJETOS && !comProjetos ? ABA.DADOS : aba;

  return (
    <>
      {comFormularios && <AlertasDaPessoa leadId={lead.id} onAbrirResposta={abrirResposta} />}
      <Tabs className="min-h-0 flex-1 gap-0" onValueChange={setAba} value={abaAtual}>
        <TabsList className="mx-4 mb-3 max-w-[calc(100%-2rem)] overflow-x-auto" variant="line">
          <TabsTrigger value={ABA.DADOS}>Dados</TabsTrigger>
          <TabsTrigger value={ABA.OPORTUNIDADES}>Oportunidades</TabsTrigger>
          {comAtividades && <TabsTrigger value={ABA.ATIVIDADES}>Atividades</TabsTrigger>}
          {comAtividades && <TabsTrigger value={ABA.HISTORICO}>Histórico</TabsTrigger>}
          {comFormularios && <TabsTrigger value={ABA.FORMULARIOS}>Formulários</TabsTrigger>}
          {comProjetos && <TabsTrigger value={ABA.PROJETOS}>Projetos</TabsTrigger>}
        </TabsList>
        <TabsContent className="min-h-0 overflow-y-auto" value={ABA.DADOS}>
          <LeadDetalhe campos={campos} layout={layout} lead={lead} nomePorId={nomePorId} />
        </TabsContent>
        <TabsContent className={PAINEL_CLASS} value={ABA.OPORTUNIDADES}>
          <AbaOportunidades lead={lead} nomePorId={nomePorId} />
        </TabsContent>
        {comAtividades && (
          <TabsContent className={PAINEL_CLASS} value={ABA.ATIVIDADES}>
            <AbaAtividades leadId={lead.id} />
          </TabsContent>
        )}
        {comAtividades && (
          <TabsContent className={PAINEL_CLASS} value={ABA.HISTORICO}>
            <AbaHistorico
              leadId={lead.id}
              nomePorId={nomePorId}
              onAbrirResposta={comFormularios ? abrirResposta : undefined}
            />
          </TabsContent>
        )}
        {comFormularios && (
          <TabsContent className={PAINEL_CLASS} value={ABA.FORMULARIOS}>
            <AbaFormularios
              lead={lead}
              nomePorId={nomePorId}
              onAbrirResposta={abrirResposta}
              respostaAberta={respostaAberta}
            />
          </TabsContent>
        )}
        {comProjetos && (
          <TabsContent className={PAINEL_CLASS} value={ABA.PROJETOS}>
            <AbaProjetos projetos={projetos} />
          </TabsContent>
        )}
      </Tabs>
    </>
  );
}
