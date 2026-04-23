export interface ConsoleReentryItem {
  id: string;
  title: string;
  kind: string;
  detail: string;
}

export interface ConsoleSignalGroup {
  id: string;
  marker: '/!' | '/~' | '/?' | '/@';
  title: string;
  items: string[];
}

export interface ConsoleOrientationItem {
  id: string;
  label: string;
  detail: string;
}

export interface ConsoleOrientationSection {
  id: string;
  title: string;
  items: ConsoleOrientationItem[];
}

export interface ConsoleSurfaceData {
  reentryItems: ConsoleReentryItem[];
  signalGroups: ConsoleSignalGroup[];
  orientationSections: ConsoleOrientationSection[];
  stewardshipItems: string[];
}
