import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { DeleteTenantDialog } from '../components/delete-tenant-dialog';
import { TenantIdentitySection } from '../components/tenant-identity-section';
import { TenantModulesSection } from '../components/tenant-modules-section';
import { TenantStatusSection } from '../components/tenant-status-section';
import { useTenant } from '../hooks/use-tenant';

const TENANT_ERROR_ID = 'admin-tenant-error';

export default function TenantDetailPage() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const { authApi } = useAdminAuth();
  const { tenant, carregando, erro, recarregar } = useTenant(authApi, tenantId);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const voltar = (
    <Button render={<Link to="/admin/tenants" />} size="sm" variant="outline">
      <ArrowLeft aria-hidden="true" />
      Todos os tenants
    </Button>
  );

  if (carregando) {
    return (
      <>
        <PageHeader actions={voltar} title="Tenant" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </>
    );
  }

  if (erro) {
    return (
      <>
        <PageHeader actions={voltar} title="Tenant" />
        <ApiErrorAlert error={erro} id={TENANT_ERROR_ID} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        actions={voltar}
        description={tenant.subdomain}
        title={tenant.nome}
      />

      <div className="grid gap-6">
        {/* Sem `key` de remontagem: depois de um salvamento bem-sucedido o
            estado local de cada seção já é igual ao que foi gravado — é o que
            faz os botões voltarem a ficar desabilitados. Remontar aqui só
            apagaria a confirmação de "salvo" no instante em que ela aparece. */}
        <TenantIdentitySection
          adminApi={authApi}
          onSaved={recarregar}
          tenant={tenant}
        />

        <TenantStatusSection
          adminApi={authApi}
          onSaved={recarregar}
          tenant={tenant}
        />

        <TenantModulesSection
          adminApi={authApi}
          onSaved={recarregar}
          tenant={tenant}
        />

        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle>Excluir tenant</CardTitle>
            <CardDescription>
              Remove a conta e os dados associados. A ação não pode ser desfeita.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsDeleteOpen(true)} variant="destructive">
              Excluir tenant
            </Button>
          </CardContent>
        </Card>
      </div>

      <DeleteTenantDialog
        adminApi={authApi}
        onDeleted={() => navigate('/admin/tenants', { replace: true })}
        onOpenChange={setIsDeleteOpen}
        open={isDeleteOpen}
        tenant={tenant}
      />
    </>
  );
}
