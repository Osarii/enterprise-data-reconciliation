import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import { PRISMA_SERVICE } from '../prisma/prisma.tokens';
import { HealthService } from './health.service';

type QueryRawMock = (
  query: TemplateStringsArray,
  ...values: unknown[]
) => Promise<unknown>;

describe('HealthService', () => {
  let service: HealthService;

  const prismaMock = {
    $queryRaw: jest.fn<QueryRawMock>(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: PRISMA_SERVICE,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  describe('getApplicationHealth', () => {
    it('should return application health information', () => {
      const result = service.getApplicationHealth();

      expect(result.status).toBe('ok');
      expect(result.service).toBe(
        'enterprise-data-reconciliation-api',
      );
      expect(result.version).toBe('0.2.0');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('getDatabaseHealth', () => {
    it('should return ok when PostgreSQL is available', async () => {
      prismaMock.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const result = await service.getDatabaseHealth();

      expect(result.status).toBe('ok');
      expect(result.database).toBe('postgresql');
      expect(result.responseTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeDefined();
      expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('should throw ServiceUnavailableException when database fails', async () => {
      prismaMock.$queryRaw.mockRejectedValue(
        new Error('Database unavailable'),
      );

      await expect(
        service.getDatabaseHealth(),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });
  });
});