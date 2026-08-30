/**
 * @file Organiza a tela de configuracoes page, na área de configurações, e coordena navegação,
 * consultas e ações do usuário.
 */
import { ApiErrorAlert } from '@/components/api-error-alert';
import { AsyncContent, FormSkeleton } from '@/components/loading-skeletons';
import { PageHeader } from '@/components/page-header';
import { useAuth } from '@/hooks/useAuth';
import { InstallAppSection } from '@/pwa/install-app-section';

import { AccountSection } from '../components/account-section';
import { AppearanceSection } from '../components/appearance-section';
import { MfaSection } from '../components/mfa-section';
import { useAuthSettings } from '../hooks/use-auth-settings';

const SETTINGS_ERROR_ID = 'configuracoes-settings-error';

export default function ConfiguracoesPage() {
  const { syncMfaEnabled, authApi } = useAuth();
  const { settings, carregando, erro } = useAuthSettings(authApi);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Preferências"
        title="Configurações"
        description="Gerencie a aparência da interface e a segurança da sua conta."
      />

      <AppearanceSection />
      <InstallAppSection />

      <AsyncContent
        loading={carregando}
        skeleton={
          <div className="grid gap-6">
            <FormSkeleton fields={3} label="Carregando dados da conta…" />
            <FormSkeleton fields={2} label="Carregando configurações de segurança…" />
          </div>
        }
      >
        {erro ? (
          <ApiErrorAlert error={erro} id={SETTINGS_ERROR_ID} />
        ) : (
          <div className="grid gap-6">
            <AccountSection nome={settings.nome} email={settings.email} role={settings.role} />
            <MfaSection
              initialEnabled={settings.mfaAtivo}
              syncMfaEnabled={syncMfaEnabled}
              authApi={authApi}
            />
          </div>
        )}
      </AsyncContent>
    </div>
  );
}
