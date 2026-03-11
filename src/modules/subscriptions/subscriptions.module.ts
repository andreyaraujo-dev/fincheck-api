import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { StripeService } from './services/stripe.service';

@Module({
  imports: [NotificationsModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, StripeService],
  exports: [StripeService],
})
export class SubscriptionsModule {}
