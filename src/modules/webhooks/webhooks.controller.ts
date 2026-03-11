import {
  BadRequestException,
  Controller,
  Post,
  Req,
  Headers,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Request } from 'express';
import { IsPublic } from '../../shared/decorators/is-public';
import { WebhooksService } from './webhooks.service';

@ApiExcludeController()
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('stripe')
  @IsPublic()
  async stripeWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string | undefined,
  ) {
    const rawBody = request.rawBody;
    if (!rawBody) {
      throw new BadRequestException(
        'Raw body is required for Stripe webhook verification',
      );
    }
    await this.webhooksService.handleStripeEvent(rawBody, signature);
  }
}
