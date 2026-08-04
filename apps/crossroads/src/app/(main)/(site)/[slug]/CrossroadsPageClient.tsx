"use client";

// CrossroadsPageClient — layout router for the Crossroads Page.
//
// Responsibilities:
//   1. Fetch admission status (public) for the current viewer.
//   2. Fetch page state from the Steward API — presence of a 200 response
//      (not 403) means the current user is a Steward or above.
//   3. Route to the correct layout template based on layout_template.
//   4. If Steward: show AdminEditBar above the page.

import { useEffect, useState } from "react";
import { Box } from "@chakra-ui/react";
import { useAuth } from "@/lib/auth/AuthContext";
import { fetchAdmissionStatus } from "@mixtape/api/clients/public/publicApi";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import type {
  PublicGroupDetail,
  AdmissionStatus,
  PageComponent,
  LayoutTemplate,
} from "@mixtape/api/clients/public/publicApi";
import AdminEditBar from "./AdminEditBar";
import StandardTemplate from "./templates/StandardTemplate";
import HeroTemplate from "./templates/HeroTemplate";
import FocusTemplate from "./templates/FocusTemplate";
import DirectoryTemplate from "./templates/DirectoryTemplate";

interface Props {
  group: PublicGroupDetail;
  layoutTemplate: LayoutTemplate;
  components: PageComponent[];
  groupSlug: string;
}

interface PageState {
  status: string;
  layout_template: LayoutTemplate;
  needs_review: boolean;
}

const TEMPLATES = {
  standard: StandardTemplate,
  hero: HeroTemplate,
  focus: FocusTemplate,
  directory: DirectoryTemplate,
} as const;

export default function CrossroadsPageClient({
  group,
  layoutTemplate,
  components,
  groupSlug,
}: Props) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [admissionStatus, setAdmissionStatus] = useState<AdmissionStatus | null>(null);
  const [isSteward, setIsSteward] = useState(false);
  const [pageState, setPageState] = useState<PageState>({
    status: "published",
    layout_template: layoutTemplate,
    needs_review: false,
  });

  // Fetch admission status on mount and again once auth resolves.
  useEffect(() => {
    fetchAdmissionStatus(groupSlug).then(setAdmissionStatus).catch(() => {});
  }, [groupSlug]);

  useEffect(() => {
    if (authLoading) return;
    fetchAdmissionStatus(groupSlug).then(setAdmissionStatus).catch(() => {});
  }, [groupSlug, authLoading]);

  // Check Steward status: if the management endpoint returns 200, user is Steward+.
  useEffect(() => {
    if (!isAuthenticated) {
      setIsSteward(false);
      return;
    }
    axiosInstance
      .get(`/api/groups/${groupSlug}/public-page`)
      .then((res) => {
        setIsSteward(true);
        setPageState({
          status: res.data.status,
          layout_template: res.data.layout_template ?? layoutTemplate,
          needs_review: res.data.needs_review ?? false,
        });
      })
      .catch(() => setIsSteward(false));
  }, [groupSlug, isAuthenticated, layoutTemplate]);

  const TemplateComponent = TEMPLATES[pageState.layout_template] ?? StandardTemplate;

  const templateProps = {
    group,
    components,
    admissionStatus,
    isAuthenticated,
    authLoading,
    isSteward,
    onStatusChange: setAdmissionStatus,
  };

  return (
    <Box className="cp-root">
      {isSteward && (
        <AdminEditBar
          groupSlug={groupSlug}
          pageState={pageState}
          onPageStateChange={(next) => setPageState((prev) => ({ ...prev, ...next }))}
        />
      )}
      <TemplateComponent {...templateProps} />
    </Box>
  );
}
