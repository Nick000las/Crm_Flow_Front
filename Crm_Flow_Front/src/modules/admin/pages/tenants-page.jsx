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
  const { tenants, carregando, erro, recarregar } = useTenants(authApi);
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
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : erro ? (
        <ApiErrorAlert error={erro} id={TENANTS_ERROR_ID} />
      ) : (
        <TenantsTable acaoVazio={botaoNovo} tenants={tenants} />
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
