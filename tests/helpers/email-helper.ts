// tests/helpers/email-helper.ts
import { Page } from '@playwright/test';

export class EmailHelper {
  private static BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8010';

  static async getLastEmail(page: Page): Promise<EmailData> {
    // Add trailing slash to match Django URL pattern
    const response = await page.request.get(`${this.BACKEND_URL}/api/test/last-email/`);

    const text = await response.text();

    // 404 means no emails sent (which is expected before sending invite)
    if (response.status() === 404) {
      throw new Error('No emails in outbox yet');
    }

    if (response.status() !== 200) {
      throw new Error(`Failed to get email. Status: ${response.status()}, Body: ${text}`);
    }

    const data = JSON.parse(text);
    return data;
  }

  static extractInviteLink(emailHtml: string): string {
    const match = emailHtml.match(/href="([^"]*\/invitations\/accept\/[^"]*)"/);
    if (!match) throw new Error('No invite link found in email');
    return match[1];
  }

  static async clearEmails(page: Page): Promise<void> {
    // Add trailing slash here too
    await page.request.post(`${this.BACKEND_URL}/api/test/clear-emails/`);
  }
}

interface EmailData {
  subject: string;
  body: string;
  html_body: string;
  to: string[];
  from: string;
}