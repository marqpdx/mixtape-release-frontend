export interface MenuItem {
  key: string;
  label: string;
  icon?: string;
  minRole?: string;
  hidden?: boolean;
  exclude?: string[];
  subItems?: MenuItem[];
}

export interface WorkAreaProps {
  section: string;
  setActiveSection: (section: string) => void;
  [key: string]: any;
}

export interface DashboardLayoutProps {
  title: string;
  menuItems: MenuItem[];
  defaultSection: string;
  defaultOpenParentMap?: Record<string, string>;
  userRoles?: string[];
  WorkAreaComponent: React.ComponentType<WorkAreaProps>;
  workAreaProps?: Record<string, any>;
  loading?: boolean;
  localStorageKey?: string;
}