// tests/helpers/navigation-helper.ts

import { Page } from '@playwright/test';

export class NavigationHelper {
  /**
   * Navigate to My Groups via dashboard with localStorage
   */
  static async navigateToMyGroups(page: Page): Promise<void> {
    await page.goto('/dashboard');
    await page.evaluate(() => {
      localStorage.setItem('memberDashboard', 'my-groups');
    });
    await page.goto('/dashboard');
  }

  /**
   * Navigate to a group's specific section using localStorage
   */
  static async navigateToGroupSection(
    page: Page,
    groupSlug: string,
    section: string
  ): Promise<void> {
    await page.goto(`/groups/${groupSlug}`);
    await page.evaluate(({ slug, sec }) => {
      localStorage.setItem(`group-${slug}-dashboard`, sec);
    }, { slug: groupSlug, sec: section });
    await page.goto(`/groups/${groupSlug}`);
  }

  /**
   * Navigate to group invitations section
   */
  static async navigateToInvitations(
    page: Page,
    groupSlug: string
  ): Promise<void> {
    await this.navigateToGroupSection(page, groupSlug, 'invitations');
  }

  /**
   * Navigate to group members section
   */
  static async navigateToMembers(
    page: Page,
    groupSlug: string
  ): Promise<void> {
    await this.navigateToGroupSection(page, groupSlug, 'members');
  }
}