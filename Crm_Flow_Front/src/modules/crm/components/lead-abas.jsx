import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProjetosDoLead } from '../hooks/use-projetos-do-lead';
import { AbaAtividades } from './atividades/aba-atividades';
import { AbaHistorico } from './historico/aba-historico';
import { LeadDetalhe } from './lead-detalhe';
import { AbaOportunidades } from './oportunidades/aba-oportunidades';
import { AbaProjetos } from './projetos/aba-projetos';

const ABA = Object.freeze({
  DADOS: 'dados',
  OPORTUNIDADES: 'oportunidades',
  ATIVIDADES: 'atividades',
  HISTORICO: 'historico',
  PROJETOS: 'projetos',
});
const PAINEL_CLASS = 'min-h-0 overflow-y-auto px-4 pb-4';

/**
 * Corpo do drawer no modo de ver: Dados e Oportunidades sempre (M2.5, sem
 * flag); Atividades e Histórico com `crm.atividades`; "Projetos" só com cards
 * ligados ao lead. Só a aba aberta monta (e busca).
 *
 * @param {{
 *   comAtividades: boolean,
 *   lead: import('../types').Lead,
 *   campos: import('../types').Campo[],
 *   layout: import('../lib/layout').LayoutEfetivo | null,
 *   nomePorId: Map<string, string>,
 * }} props
 */
export function LeadAbas({ comAtividades, lead, campos, layout, nomePorId }) {
  const [aba, setAba] = useState(ABA.DADOS);
  const projetos = useProjetosDoLead(lead.id);
  const comProjetos = projetos.length > 0;

  // A lista pode esvaziar com a aba aberta (vínculo removido em outra tela).
  const abaAtual = aba === ABA.PROJETOS && !comProjetos ? ABA.DADOS : aba;

  return (
    <Tabs className="min-h-0 flex-1 gap-0" onValueChange={setAba} value={abaAtual}>
      <TabsList className="mx-4 mb-3" variant="line">
        <TabsTrigger value={ABA.DADOS}>Dados</TabsTrigger>
        <TabsTrigger value={ABA.OPORTUNIDADES}>Oportunidades</TabsTrigger>
        {comAtividades && <TabsTrigger value={ABA.ATIVIDADES}>Atividades</TabsTrigger>}
        {comAtividades && <TabsTrigger value={ABA.HISTORICO}>Histórico</TabsTrigger>}
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
          <AbaHistorico leadId={lead.id} nomePorId={nomePorId} />
        </TabsContent>
      )}
      {comProjetos && (
        <TabsContent className={PAINEL_CLASS} value={ABA.PROJETOS}>
          <AbaProjetos projetos={projetos} />
        </TabsContent>
      )}
    </Tabs>
  );
}
