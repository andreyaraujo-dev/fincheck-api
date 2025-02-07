import { Injectable } from '@nestjs/common';
import { version, name } from '../package.json';
import { env } from './shared/config/env';

@Injectable()
export class AppService {
  constructor() {}
  execute() {
    return {
      version,
      name,
      environment: env.nodeEnv,
      time: new Date().toISOString(),
    };
  }
}
