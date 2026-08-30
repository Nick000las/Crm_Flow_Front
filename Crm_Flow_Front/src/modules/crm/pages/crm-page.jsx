import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/page-header';

export default function CrmPage() {
  return (
    <>
      <PageHeader title="CRM" description="Pipeline de leads e negociações." />
      <div className="rounded-xl border p-6 space-y-3">
        <h2 className="font-semibold">Quadros de trabalho</h2>
        <p className="text-muted-foreground">
          Crie quadros do tipo CRM para organizar cards e acompanhar suas etapas. Os cards ainda não
          estão vinculados aos registros de leads.
        </p>
        <Link
          className="inline-flex rounded-md bg-primary px-4 py-2 text-primary-foreground"
          to="/kanban"
        >
          Abrir Kanban
        </Link>
      </div>
    </>
  );
}
