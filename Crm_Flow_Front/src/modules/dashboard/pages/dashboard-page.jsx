import { ModulePlaceholder } from '@/components/module-placeholder';
import { PageHeader } from '@/components/page-header';

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Visão consolidada da operação."
      />
      <ModulePlaceholder
        title="Módulo em construção"
        description="Os indicadores e gráficos do Dashboard entram em uma etapa própria."
      />
    </>
  );
}
