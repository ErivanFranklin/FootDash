import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
  ) {
    const rawUrl = this.config.get<string>('FRONTEND_URL') || 'http://localhost:4200';
    this.frontendUrl = rawUrl.replace(/\/$/, '');
  }

  /**
   * Send a password-reset email with a link containing the raw token.
   */
  async sendPasswordResetEmail(email: string, rawToken: string): Promise<void> {
    const resetLink = `${this.frontendUrl}/auth/reset-password?token=${rawToken}`;

    const subject = 'FootDash — Reset Your Password';
    const text = [
      'Hi,',
      '',
      'You requested a password reset for your FootDash account.',
      `Click the link below to set a new password (valid for 30 minutes):`,
      '',
      resetLink,
      '',
      'If you did not request this, you can safely ignore this email.',
      '',
      '— The FootDash Team',
    ].join('\n');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #3880ff;">FootDash</h2>
        <p>Hi,</p>
        <p>You requested a password reset for your FootDash account.</p>
        <p>
          <a href="${resetLink}"
             style="display: inline-block; padding: 12px 24px; background: #3880ff;
                    color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Reset Password
          </a>
        </p>
        <p style="color: #888; font-size: 13px;">
          This link is valid for 30 minutes. If you did not request this, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #aaa; font-size: 12px;">— The FootDash Team</p>
      </div>
    `;

    try {
      await this.mailer.sendMail({ to: email, subject, text, html });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
