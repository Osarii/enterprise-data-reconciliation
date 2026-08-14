import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

import { PRISMA_SERVICE } from '../prisma/prisma.tokens';

export interface ApplicationHealth {
  status: 'ok';
  service: string;
  version: string;
  timestamp: string;
}

export interface DatabaseHealth {
  status: 'ok';
  database: 'postgresql';
  responseTimeMs: number;
  timestamp: string;
}

export interface DatabaseHealthClient {
  $queryRaw<T = unknown>(
    query: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T>;
}

@Injectable()
export class HealthService {
  constructor(
    @Inject(PRISMA_SERVICE)
    private readonly prisma: DatabaseHealthClient,
  ) {}

  getApplicationHealth(): ApplicationHealth {
    return {
      status: 'ok',
      service: 'enterprise-data-reconciliation-api',
      version: '0.2.0',
      timestamp: new Date().toISOString(),
    };
  }

  async getDatabaseHealth(): Promise<DatabaseHealth> {
    const startedAt = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        database: 'postgresql',
        responseTimeMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'postgresql',
        message: 'Database connection unavailable.',
        timestamp: new Date().toISOString(),
      });
    }
  }
}