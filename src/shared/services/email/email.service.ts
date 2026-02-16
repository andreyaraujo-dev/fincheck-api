import { Inject, Injectable } from '@nestjs/common';
import * as Brevo from '@getbrevo/brevo';
import * as fs from 'fs';
import * as path from 'path';

import { ConstantKeys } from '../../config/constant-keys';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class EmailService {
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly appUrl: string;
  private readonly apiInstance: Brevo.TransactionalEmailsApi;

  constructor(
    @Inject(ConstantKeys.brevoApiKey)
    brevoApiKey: string,
    @Inject(ConstantKeys.brevoFromEmail)
    brevoFromEmail: string,
    @Inject(ConstantKeys.brevoFromName)
    brevoFromName: string,
    @Inject(ConstantKeys.appUrl)
    appUrl: string,
    private readonly loggerService: LoggerService,
  ) {
    this.loggerService.setContext(EmailService.name);
    this.fromEmail = brevoFromEmail;
    this.fromName = brevoFromName;
    this.appUrl = appUrl;

    this.apiInstance = new Brevo.TransactionalEmailsApi();
    this.apiInstance.setApiKey(
      Brevo.TransactionalEmailsApiApiKeys.apiKey,
      brevoApiKey,
    );
  }

  async sendEmail(
    to: string,
    subject: string,
    templateName: string,
    variables: Record<string, string>,
  ): Promise<void> {
    try {
      const allVariables: Record<string, string> = {
        appUrl: this.appUrl,
        iconUrl: `${this.appUrl}/mycash-icon.png`,
        ...variables,
      };
      const html = this.loadTemplate(templateName);
      const processedHtml = this.replaceVariables(html, allVariables);

      const email = new Brevo.SendSmtpEmail();
      email.sender = { email: this.fromEmail, name: this.fromName };
      email.to = [{ email: to }];
      email.subject = subject;
      email.htmlContent = processedHtml;

      await this.apiInstance.sendTransacEmail(email);

      this.loggerService.log(
        `Email "${subject}" enviado para ${to} (template: ${templateName})`,
      );
    } catch (error) {
      this.loggerService.error(
        `Falha ao enviar email "${subject}" para ${to}: ${error.message}`,
        error?.response?.body
          ? JSON.stringify(error.response.body)
          : error.stack,
      );
      throw error;
    }
  }

  private loadTemplate(templateName: string): string {
    const templatePath = path.join(
      __dirname,
      '..',
      '..',
      'templates',
      `${templateName}.html`,
    );

    return fs.readFileSync(templatePath, 'utf-8');
  }

  private replaceVariables(
    html: string,
    variables: Record<string, string>,
  ): string {
    return Object.entries(variables).reduce(
      (result, [key, value]) =>
        result.replace(new RegExp(`{{${key}}}`, 'g'), value),
      html,
    );
  }
}
