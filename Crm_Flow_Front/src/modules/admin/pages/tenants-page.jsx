/**
 * @file Organiza a tela de tenants page, na área de administração, e coordena navegação,
 * consultas e ações do usuário.
 */
import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';

import { ApiErrorAlert } from '@/components/api-error-alert';
import { AsyncContent, TableSkeleton } from '@/components/loading-skeletons';
import { LoadingState } from '@/components/loading-state';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { useAdminAuth } from '@/hooks/use-admin-auth';

import { CreateTenantDialog } from '../components/create-tenant-dialog';
import { TenantsTable } from '../components/tenants-table';
import { useTenants } from '../hooks/use-tenants';

const TENANTS_ERROR_ID = 'admin-tenants-error';

export default function TenantsPage() {
  const { authApi } = useAdminAuth();
  const { tenants, carregando, atualizando, erro, recarregar } = useTenants(authApi);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');

  const tenantsFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');

    return (tenants ?? []).filter((tenant) => {
      if (statusFiltro && tenant.status !== statusFiltro) {
        return false;
      }

      if (!termo) {
        return true;
      }

      return (
        String(tenant.nome ?? '')
          .toLocaleLowerCase('pt-BR')
          .includes(termo) ||
        String(tenant.subdomain ?? '')
          .toLocaleLowerCase('pt-BR')
          .includes(termo)
      );
    });
  }, [tenants, busca, statusFiltro]);

  const botaoNovo = (
    <Button data-tour="admin-tenants-new" onClick={() => setIsCreateOpen(true)}>
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

      <AsyncContent
        loading={carregando}
        skeleton={<TableSkeleton rows={6} columns={4} label="Carregando tenants…" />}
      >
        {erro && !tenants ? (
          <ApiErrorAlert error={erro} id={TENANTS_ERROR_ID} />
        ) : (
          <section aria-label="Lista de tenants" aria-busy={atualizando} className="grid gap-3">
            {erro && <ApiErrorAlert error={erro} id={TENANTS_ERROR_ID} />}
            {atualizando && <LoadingState inline label="Atualizando tenants…" />}
            {tenants && tenants.length > 0 && (
              <div
                data-tour="admin-tenants-filters"
                className="flex flex-col gap-2 rounded-xl border border-border bg-card/80 p-3 sm:flex-row sm:items-center"
              >
                <Input
                  aria-label="Buscar tenants"
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder="Buscar por nome ou subdomínio…"
                  startIcon={Search}
                  type="search"
                  value={busca}
                  wrapperClassName="flex-1"
                />
                <div className="sm:w-44">
                  <NativeSelect
                    aria-label="Filtrar por status"
                    onChange={(event) => setStatusFiltro(event.target.value)}
                    value={statusFiltro}
                  >
                    <option value="">Status: Todos</option>
                    <option value="ACTIVE">Ativos</option>
                    <option value="SUSPENDED">Suspensos</option>
                    <option value="CANCELLED">Cancelados</option>
                  </NativeSelect>
                </div>
              </div>
            )}
            <div data-tour="admin-tenants-table">
              <TenantsTable
                acaoVazio={botaoNovo}
                filtrado={Boolean(busca.trim() || statusFiltro)}
                onLimparFiltros={() => {
                  setBusca('');
                  setStatusFiltro('');
                }}
                tenants={tenantsFiltrados}
              />
            </div>
          </section>
        )}
      </AsyncContent>

      <CreateTenantDialog
        adminApi={authApi}
        onCreated={recarregar}
        onOpenChange={setIsCreateOpen}
        open={isCreateOpen}
      />
    </>
  );
}
