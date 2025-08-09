import { Injectable } from '@nestjs/common';
import { register, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class MetricsService {
  constructor() {
    collectDefaultMetrics();
  }

  async getMetrics() {
    return register.metrics();
  }
}
