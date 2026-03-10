import { ApiProperty } from '@nestjs/swagger';

export class MfaSetupResponseDto {
  @ApiProperty({
    description: 'Data URL do QR code para escanear no app autenticador',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
  })
  qrCodeDataUrl: string;

  @ApiProperty({
    description: 'Secret em base32 para entrada manual no app (opcional)',
    example: 'JBSWY3DPEHPK3PXP',
  })
  secret: string;
}
