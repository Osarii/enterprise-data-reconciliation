import { Controller, Get } from '@nestjs/common';

import { HealthService } from './health.service';
import type {
  ApplicationHealth,
  DatabaseHealth,
} from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getApplicationHealth(): ApplicationHealth {
    return this.healthService.getApplicationHealth();
  }

  @Get('database')
  async getDatabaseHealth(): Promise<DatabaseHealth> {
    return this.healthService.getDatabaseHealth();
  }
}