/**
 * @file Renderiza tenants table, na área de administração, expondo os estados e eventos
 * necessários à interface.
 */
import { Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { ModulePlaceholder } from '@/components/module-placeholder';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { TenantStatusBadge } from './tenant-status-badge';

export function TenantsTable({ tenants, acaoVazio }) {
  if (tenants.length === 0) {
    return (
      <ModulePlaceholder
        icon={Building2}
        title="Nenhum tenant provisionado"
        description="Crie o primeiro tenant para liberar o acesso de uma empresa à plataforma."
      >
        {acaoVazio}
      </ModulePlaceholder>
    );
  }

  return (
    <div className="theme-data-table overflow-x-auto border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Nome</TableHead>
            <TableHead scope="col">Subdomínio</TableHead>
            <TableHead scope="col">Módulos</TableHead>
            <TableHead scope="col">Status</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {tenants.map((tenant) => (
            <TableRow className="hover:bg-muted/40" key={tenant.id}>
              <TableCell className="font-medium">
                <Link
                  className="underline-offset-4 outline-none hover:underline focus-visible:underline"
                  to={`/admin/tenants/${tenant.id}`}
                >
                  {tenant.nome}
                </Link>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{tenant.subdomain}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatarModulos(tenant.modulosContratados)}
              </TableCell>
              <TableCell>
                <TenantStatusBadge status={tenant.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function formatarModulos(modulos) {
  if (!Array.isArray(modulos) || modulos.length === 0) {
    return '—';
  }

  return modulos.join(', ');
}
