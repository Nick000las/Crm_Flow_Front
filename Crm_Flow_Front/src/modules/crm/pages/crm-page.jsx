import { ModulePlaceholder } from '@/components/module-placeholder';
import { PageHeader } from '@/components/page-header';

export default function CrmPage() {
  return (
    <>
      <PageHeader title="CRM" description="Pipeline de leads e negociações." />
      <ModulePlaceholder
        title="Módulo em construção"
        description="O motor de Kanban e o drag-and-drop do CRM entram em uma etapa própria."
      />
    </>
  );
}
