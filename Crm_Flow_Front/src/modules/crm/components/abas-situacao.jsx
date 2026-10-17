import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ROTULOS_SITUACAO, SITUACOES_LEAD } from '../constants';

const SITUACOES = Object.values(SITUACOES_LEAD);

/**
 * Ativos · Arquivados · Lixeira (`crm.arquivo`): filtro fixo da busca, não
 * filtro de campo. Um painel só, com a lista da aba ativa.
 *
 * @param {{
 *   situacao: 'ativos' | 'arquivados' | 'lixeira',
 *   onChange: (situacao: 'ativos' | 'arquivados' | 'lixeira') => void,
 *   children: import('react').ReactNode,
 * }} props
 */
export function AbasSituacao({ situacao, onChange, children }) {
  return (
    <Tabs onValueChange={onChange} value={situacao}>
      <TabsList aria-label="Situação dos leads" className="mb-3" variant="line">
        {SITUACOES.map((item) => (
          <TabsTrigger key={item} value={item}>
            {ROTULOS_SITUACAO[item]}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value={situacao}>{children}</TabsContent>
    </Tabs>
  );
}
