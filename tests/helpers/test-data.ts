// tests/helpers/test-data.ts
import { Page } from '@playwright/test';

export class TestData {
  /**
   * Create a test user via API
   */
  static async createUser(page: Page, userData: {
    email: string;
    username: string;
    password: string;
  }): Promise<void> {
    await page.request.post('/api/test/create-user', {
      data: userData,
    });
  }

  /**
   * Create a test group
   */
  static async createGroup(page: Page, groupData: {
    name: string;
    slug: string;
    ownerId: number;
  }): Promise<number> {
    const response = await page.request.post('/api/test/create-group', {
      data: groupData,
    });
    const data = await response.json();
    return data.id;
  }

  /**
   * Add user to group
   */
  static async addMemberToGroup(page: Page, userId: number, groupId: number): Promise<void> {
    await page.request.post('/api/test/add-member', {
      data: { userId, groupId },
    });
  }

  /**
   * Clean up test data
   */
  static async cleanup(page: Page): Promise<void> {
    await page.request.post('/api/test/cleanup');
  }
}