// src/components/ui/alerts/MixtapeAlert.tsx
// Consolidated Alert Component - replaces SuccessAlert, ErrorAlert, InfoAlert, WarningAlert

import { Alert } from "@chakra-ui/react";

export interface MixtapeAlertProps {
  /** Alert type/severity */
  status?: "info" | "warning" | "error" | "success";
  /** Alert title (auto-generated if not provided) */
  title?: string;
  /** Alert message/description */
  description: string;
  /** Alert size */
  size?: "sm" | "md" | "lg";
  /** Custom icon (uses default status icon if not provided) */
  icon?: React.ReactNode;
}

// Default titles for each status type
const DEFAULT_TITLES: Record<MixtapeAlertProps["status"] & string, string> = {
  success: "Success!",
  error: "Something went wrong",
  warning: "Warning",
  info: "Info",
};

/**
 * Consolidated Alert Component
 *
 * @example
 * ```tsx
 * <MixtapeAlert status="success" description="Saved successfully!" />
 * <MixtapeAlert status="error" title="Error" description="Failed to save" />
 * <MixtapeAlert status="warning" description="Unsaved changes" size="lg" />
 * ```
 */
export const MixtapeAlert = ({
  status = "warning",
  title,
  description,
  size = "sm",
  icon
}: MixtapeAlertProps) => {
  // Use custom title or default based on status
  const alertTitle = title ?? DEFAULT_TITLES[status];

  return (
    <Alert.Root status={status} size={size}>
      {icon ? (
        <Alert.Indicator>{icon}</Alert.Indicator>
      ) : (
        <Alert.Indicator />
      )}
      <Alert.Content>
        {alertTitle && <Alert.Title>{alertTitle}</Alert.Title>}
        <Alert.Description>{description}</Alert.Description>
      </Alert.Content>
    </Alert.Root>
  );
};
