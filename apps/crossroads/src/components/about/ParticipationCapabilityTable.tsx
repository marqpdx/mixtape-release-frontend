import { Box, Table, Text } from "@chakra-ui/react";

const roles = ["Invited Participant", "Full Member", "Maker"] as const;

const capabilities = [
  {
    label: "Join invited group conversations",
    values: ["Yes", "Yes", "Yes"],
  },
  {
    label: "Create a new circle or group",
    values: ["No", "Yes", "Yes"],
  },
  {
    label: "Access member-wide spaces",
    values: ["No", "Yes", "Yes"],
  },
  {
    label: "Invite new participants to your group",
    values: ["Limited", "Yes", "Yes"],
  },
  {
    label: "Start cross-group projects",
    values: ["No", "Limited", "Yes"],
  },
  {
    label: "Steward community agreements",
    values: ["Limited", "Yes", "Yes"],
  },
  {
    label: "Access internal planning spaces",
    values: ["No", "Limited", "Yes"],
  },
  {
    label: "Help set platform direction",
    values: ["No", "No", "Yes"],
  },
  {
    label: "Maintain platform operations",
    values: ["No", "No", "Yes"],
  },
  {
    label: "Participate in community decisions",
    values: ["Limited", "Yes", "Yes"],
  },
];

export function ParticipationCapabilityTable() {
  return (
    <Box overflowX={{ base: "auto", md: "visible" }}>
      <Table.Root size="sm" variant="line">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Capability</Table.ColumnHeader>
            {roles.map((role) => (
              <Table.ColumnHeader key={role}>{role}</Table.ColumnHeader>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {capabilities.map((row) => (
            <Table.Row key={row.label}>
              <Table.Cell fontWeight="600">{row.label}</Table.Cell>
              {row.values.map((value, index) => (
                <Table.Cell key={`${row.label}-${roles[index]}`}>{value}</Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      <Text fontSize="sm" color="theme.textSecondary" mt={3}>
        Limited means within your group or with stewardship support.
      </Text>
    </Box>
  );
}
