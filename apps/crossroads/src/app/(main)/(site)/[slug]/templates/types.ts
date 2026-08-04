// Shared types for Crossroads Page layout templates.
// Each template receives the same props — pick what it needs.

import type {
  PublicGroupDetail,
  PageComponent,
} from "@mixtape/api/clients/public/publicApi";
import type { AdmissionStatus } from "@mixtape/api/clients/public/publicApi";

export interface TemplateProps {
  group: PublicGroupDetail;
  components: PageComponent[];
  admissionStatus: AdmissionStatus | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  isSteward: boolean;
  onStatusChange: (status: AdmissionStatus) => void;
}
