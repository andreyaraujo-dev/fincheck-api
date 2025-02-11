import { ArgumentMetadata, ParseBoolPipe } from '@nestjs/common';

export class OptionalParseBooleanPipe extends ParseBoolPipe {
  transform(value, metadata: ArgumentMetadata) {
    if (typeof value === 'undefined') {
      return undefined;
    }

    return super.transform(value, metadata);
  }
}
