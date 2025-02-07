import { Inject, Injectable } from '@nestjs/common';
import { version, name } from '../package.json';
import { ConstantKeys } from './shared/config/constant-keys';

@Injectable()
export class AppService {
  constructor(
    @Inject(ConstantKeys.nodeEnv) private readonly environment: string,
  ) {}
  execute() {
    return {
      version,
      name,
      environment: this.environment,
      time: new Date().toISOString(),
    };
  }
}
