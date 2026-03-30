import type { ReactNode } from "react";

export interface MenuItem {
  key: string;
  label: string;
  icon?: string;
  minRole?: string;
  hidden?: boolean;
  adminOnly?: boolean;
  superuserOnly?: boolean;
  exclude?: string[];
  subItems?: MenuItem[];
}

export interface WorkAreaProps {
  section: string;
  sectionParams?: Record<string, string>;
  setActiveSection: (section: string, params?: Record<string, string>) => void;
  [key: string]: unknown;
}

export interface DashboardLayoutProps {
  title: string;
  header?: ReactNode;
  menuItems: MenuItem[];
  defaultSection: string;
  defaultOpenParentMap?: Record<string, string>;
  userRoles?: string[];
  WorkAreaComponent: React.ComponentType<WorkAreaProps>;
  workAreaProps?: Record<string, unknown>;
  loading?: boolean;
  localStorageKey?: string;
}
