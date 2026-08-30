import { ApiErrorAlert } from '@/components/api-error-alert';
import { PageHeader } from '@/components/page-header';
import { useAuth } from '@/hooks/useAuth';
import { AccountSection } from '../components/account-section';
import { MfaSection } from '../components/mfa-section';
import { useAuthSettings } from '../hooks/use-auth-settings';

const SETTINGS_ERROR_ID = 'configuracoes-settings-error';

export default function ConfiguracoesPage() {
  const { syncMfaEnabled, authApi } = useAuth();
  const { settings, carregando, erro } = useAuthSettings(authApi);

  return (
    <>
      <PageHeader
        title="Configurações"
        description="Gerencie a segurança da sua conta."
      />

      {carregando ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : erro ? (
        <ApiErrorAlert error={erro} id={SETTINGS_ERROR_ID} />
      ) : (
        <div className="grid gap-6">
          <AccountSection
            nome={settings.nome}
            email={settings.email}
            role={settings.role}
          />
          <MfaSection
            initialEnabled={settings.mfaAtivo}
            syncMfaEnabled={syncMfaEnabled}
            authApi={authApi}
          />
        </div>
      )}
    </>
  );
}
