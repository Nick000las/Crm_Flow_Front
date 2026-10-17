import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AbaAtividades } from './atividades/aba-atividades';
import { AbaHistorico } from './historico/aba-historico';
import { LeadDetalhe } from './lead-detalhe';

const ABA = Object.freeze({ DADOS: 'dados', ATIVIDADES: 'atividades', HISTORICO: 'historico' });

/**
 * Corpo do drawer no modo de ver. Com `crm.atividades`: abas Dados ·
 * Atividades · Histórico — só a aba aberta monta (e busca). Sem a flag, só
 * os dados, como antes.
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
  const detalhe = <LeadDetalhe campos={campos} layout={layout} lead={lead} nomePorId={nomePorId} />;

  if (!comAtividades) return <div className="overflow-y-auto">{detalhe}</div>;

  return (
    <Tabs className="min-h-0 flex-1 gap-0" onValueChange={setAba} value={aba}>
      <TabsList className="mx-4 mb-3" variant="line">
        <TabsTrigger value={ABA.DADOS}>Dados</TabsTrigger>
        <TabsTrigger value={ABA.ATIVIDADES}>Atividades</TabsTrigger>
        <TabsTrigger value={ABA.HISTORICO}>Histórico</TabsTrigger>
      </TabsList>
      <TabsContent className="min-h-0 overflow-y-auto" value={ABA.DADOS}>
        {detalhe}
      </TabsContent>
      <TabsContent className="min-h-0 overflow-y-auto px-4 pb-4" value={ABA.ATIVIDADES}>
        <AbaAtividades leadId={lead.id} />
      </TabsContent>
      <TabsContent className="min-h-0 overflow-y-auto px-4 pb-4" value={ABA.HISTORICO}>
        <AbaHistorico leadId={lead.id} nomePorId={nomePorId} />
      </TabsContent>
    </Tabs>
  );
}
