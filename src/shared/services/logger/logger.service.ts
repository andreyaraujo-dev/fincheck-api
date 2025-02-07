import { Injectable, ConsoleLogger, Scope } from '@nestjs/common';

@Injectable({
  scope: Scope.TRANSIENT,
})
export class LoggerService extends ConsoleLogger {
  log(message: any): void {
    super.log.apply(this, [message]);
  }

  error(message: any, stack?: string): void {
    super.error.apply(this, [message, stack]);
  }

  warn(message: any): void {
    super.warn.apply(this, [message]);
  }

  debug(message: any): void {
    super.debug.apply(this, [message]);
  }

  verbose(message: any): void {
    super.verbose.apply(this, [message]);
  }
}
