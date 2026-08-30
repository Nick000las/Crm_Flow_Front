import { LoadingState } from '@/components/loading-state';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { CreateTenantDialog } from '../components/create-tenant-dialog';
import { TenantsTable } from '../components/tenants-table';
import { useTenants } from '../hooks/use-tenants';

const TENANTS_ERROR_ID = 'admin-tenants-error';

export default function TenantsPage() {
  const { authApi } = useAdminAuth();
  const { tenants, carregando, atualizando, erro, recarregar } = useTenants(authApi);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const botaoNovo = (
    <Button onClick={() => setIsCreateOpen(true)}>
      <Plus aria-hidden="true" />
      Novo tenant
    </Button>
  );

  return (
    <>
      <PageHeader
        actions={botaoNovo}
        description="Contas provisionadas na plataforma."
        title="Tenants"
      />

      {carregando ? (
        <LoadingState label="Carregando tenants…" />
      ) : erro && !tenants ? (
        <ApiErrorAlert error={erro} id={TENANTS_ERROR_ID} />
      ) : (
        <section aria-label="Lista de tenants" aria-busy={atualizando} className="grid gap-3">
          {erro && <ApiErrorAlert error={erro} id={TENANTS_ERROR_ID} />}
          {atualizando && <LoadingState inline label="Atualizando tenants…" />}
          <TenantsTable acaoVazio={botaoNovo} tenants={tenants} />
        </section>
      )}

      <CreateTenantDialog
        adminApi={authApi}
        onCreated={recarregar}
        onOpenChange={setIsCreateOpen}
        open={isCreateOpen}
      />
    </>
  );
}
