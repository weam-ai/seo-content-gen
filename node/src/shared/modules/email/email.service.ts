// src/email/email.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as ejs from 'ejs';
import * as path from 'path';
import { logger } from '../../utils/logger.utils';
import Mail from 'nodemailer/lib/mailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
    });
  }

  // Direct sending method for the processor
  async sendMail(
    to: string | string[],
    subject: string,
    text: string,
    html?: string,
  ): Promise<void> {
    const mailOptions: Mail.Options = {
      from: this.configService.get<string>('EMAIL_FROM'),
      to,
      subject,
      text,
      html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.log(
        'info',
        `Email sent successfully [To: ${Array.isArray(to) ? to.join(', ') : to}, Subject: ${subject}]`,
      );
    } catch (error) {
      logger.error('Error sending email:', error);
      throw error; // Re-throw for retry logic
    }
  }

  // Direct template sending method for the processor
  async sendMailWithTemplate(
    to: string | string[],
    templateName: string,
    subject: string,
    data: Record<string, any>,
  ): Promise<void> {
    try {
      // Construct the path to the EJS template
      const templatePath = path.join(
        __dirname,
        '..',
        '..',
        '..',
        'templates',
        templateName,
      );

      // Render the EJS template with the provided data
      const html = await ejs.renderFile(templatePath, data);

      // Send the email using the direct method
      await this.sendMail(to, subject, '', html);
    } catch (error) {
      logger.error('Error rendering or sending email template:', error);
      throw error;
    }
  }
}
