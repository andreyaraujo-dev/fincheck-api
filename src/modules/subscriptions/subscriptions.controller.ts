import {
  Body,
  Controller,
  Get,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ActiveUserId } from '../../shared/decorators/active-user-id';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  subscribe(
    @ActiveUserId() userId: string,
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.subscribe(userId, createSubscriptionDto);
  }

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  cancel(@ActiveUserId() userId: string) {
    return this.subscriptionsService.cancel(userId);
  }

  @Post('renew')
  @HttpCode(HttpStatus.OK)
  renew(@ActiveUserId() userId: string) {
    return this.subscriptionsService.renew(userId);
  }

  @Get('me')
  getSubscription(@ActiveUserId() userId: string) {
    return this.subscriptionsService.getSubscription(userId);
  }
}
