export interface EnvironmentVariables {
  DATABASE_URL: string;
  PORT: number;
}

export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> & EnvironmentVariables {
  const databaseUrl = config.DATABASE_URL;

  if (typeof databaseUrl !== 'string' || databaseUrl.trim().length === 0) {
    throw new Error('DATABASE_URL is required.');
  }

  const port = Number(config.PORT ?? 3000);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid TCP port between 1 and 65535.');
  }

  return {
    ...config,
    DATABASE_URL: databaseUrl,
    PORT: port,
  };
}