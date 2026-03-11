import { axiosInstance } from '@mixtape/api/lib/axiosInstance';

export interface RegisterPushTokenInput {
  token: string;
  platform: 'android' | 'ios';
  appEnvironment: string;
}

export interface RegisterPushTokenResult {
  synced: boolean;
  enabled: boolean;
}

let hasLoggedDisabledWarning = false;

function getPushRegistrationPath(): string | null {
  const path = process.env.NEXT_PUBLIC_PUSH_TOKEN_REGISTRATION_PATH?.trim();
  return path ? path : null;
}

function isPushRegistrationEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_PUSH_REGISTRATION === 'true';
}

export async function registerPushToken(
  input: RegisterPushTokenInput
): Promise<RegisterPushTokenResult> {
  const path = getPushRegistrationPath();
  const enabled = isPushRegistrationEnabled() && !!path;

  if (!enabled || !path) {
    if (!hasLoggedDisabledWarning) {
      console.info(
        '[PushApi] Push token sync is disabled. Set NEXT_PUBLIC_ENABLE_PUSH_REGISTRATION=true and NEXT_PUBLIC_PUSH_TOKEN_REGISTRATION_PATH to enable it.'
      );
      hasLoggedDisabledWarning = true;
    }

    return {
      synced: false,
      enabled: false,
    };
  }

  await axiosInstance.post(path, {
    provider: 'expo',
    token: input.token,
    platform: input.platform,
    app_environment: input.appEnvironment,
  });

  return {
    synced: true,
    enabled: true,
  };
}
