// src/components/lantern/AddSubscribersView.tsx

"use client";

import { useState, useEffect } from "react";
import {
  VStack,
  HStack,
  Text,
  Button,
  Tabs,
  Box,
  Textarea,
  Checkbox,
  Badge,
  Avatar,
  Spinner,
} from "@chakra-ui/react";
import { Divider } from "@components/common/Divider";
// import { LanternMailList } from "content/lanternTypes";
// import { useLanternmail } from "@hooks/useLanternmail";
// import { ErrorAlert, } from "@components/ui/alerts/ErrorAlert";
// import { createStandaloneToast } from "@chakra-ui/toast";
// import { SuccessAlert } from "@components/ui/alerts/SuccessAlert";
import { LanternmailList } from "@/types/lanternmailTypes";
import { Alert } from "../ui/alerts";
import { useLanternmail } from "@/hooks/lanternmail/useLanternmail";
import { toaster } from "../ui/toaster";

interface Props {
  list: LanternmailList;
  onBack: () => void;
  onComplete: () => void;
}

interface GroupMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  subscription_status: 'subscribed' | 'unsubscribed' | 'pending' | 'never_invited';
  invited_at?: string;
}

export default function AddSubscribersView({ list, onBack, onComplete }: Props) {
  const { getGroupMembers, sendInvitations, loading } = useLanternmail();
  const [activeTab, setActiveTab] = useState("group-members");
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [externalEmails, setExternalEmails] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDoneConfirmation, setShowDoneConfirmation] = useState(false);
  // const { toast } = createStandaloneToast();

  useEffect(() => {
    fetchGroupMembers();
  }, []);

  const fetchGroupMembers = async () => {
    try {
      setError(null);
      const members = await getGroupMembers(list.group_slug, list.id);
      setGroupMembers(members);
    } catch (err: any) {
      setError(err.message || "Failed to load group members");
    }
  };

  const handleMemberToggle = (memberId: string) => {
    const newSelection = new Set(selectedMembers);
    if (newSelection.has(memberId)) {
      newSelection.delete(memberId);
    } else {
      newSelection.add(memberId);
    }
    setSelectedMembers(newSelection);
  };

  const handleSelectAll = () => {
    const invitableMembers = groupMembers.filter(
      m => m.subscription_status === 'never_invited' || m.subscription_status === 'unsubscribed'
    );

    if (selectedMembers.size === invitableMembers.length) {
      // Deselect all
      setSelectedMembers(new Set());
    } else {
      // Select all invitable
      setSelectedMembers(new Set(invitableMembers.map(m => m.id)));
    }
  };

  const handleSendInvitations = async () => {
    setIsInviting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      let emailsToInvite: string[] = [];

      if (activeTab === "group-members") {
        // Get emails of selected members
        const selectedMemberEmails = groupMembers
          .filter(m => selectedMembers.has(m.id))
          .map(m => m.email);
        emailsToInvite = selectedMemberEmails;
      } else {
        // Parse external emails
        const emails = externalEmails
          .split(/[\n,;]/)
          .map(email => email.trim())
          .filter(email => email && email.includes('@'));
        emailsToInvite = emails;
      }

      if (emailsToInvite.length === 0) {
        setError("Please select members or enter valid email addresses");
        return;
      }

      const result = await sendInvitations(list.group_slug, list.id, emailsToInvite);

      setSuccessMessage(`Invitations sent to ${emailsToInvite.length} recipients`);
      toaster.create({
        title: "Invitations Sent",
        description: `${emailsToInvite.length} people will receive opt-in emails`,
        type: "success",
        duration: 5000,
        closable: true,
      });

      // Reset selections
      setSelectedMembers(new Set());
      setExternalEmails("");

      // Refresh member data
      await fetchGroupMembers();

    } catch (err: any) {
      setError(err.message || "Failed to send invitations");
    } finally {
      setIsInviting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      subscribed: { color: "green", text: "Subscribed" },
      unsubscribed: { color: "red", text: "Unsubscribed" },
      pending: { color: "yellow", text: "Pending" },
      never_invited: { color: "gray", text: "Not Invited" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.never_invited;
    return <Badge colorScheme={config.color}>{config.text}</Badge>;
  };

  const invitableMembers = groupMembers.filter(
    m => m.subscription_status === 'never_invited' || m.subscription_status === 'unsubscribed'
  );

  // Count valid external emails
  const validExternalEmails = externalEmails
    .split(/[\n,;]/)
    .map(email => email.trim())
    .filter(email => email && email.includes('@'));

  const externalEmailCount = validExternalEmails.length;

  const hasPendingInvitations = selectedMembers.size > 0 || externalEmailCount > 0;

  const handleDone = () => {
    if (hasPendingInvitations && !showDoneConfirmation) {
      setShowDoneConfirmation(true);
    } else {
      onComplete();
    }
  };

  return (
    <VStack gap={4} align="stretch">
      {/* Header */}
      <HStack justify="space-between">
        <Button variant="ghost" onClick={onBack}>
          ← Back to Details
        </Button>
        <Text fontSize="lg" fontWeight="bold">
          Add Subscribers to {list.display_name}
        </Text>
      </HStack>

      {error && <Alert  status="error" title="Error" description={error} />}

      {successMessage && (
        <Alert status="success" title="Success!" description={successMessage} />
      )}

      <Tabs.Root value={activeTab} onValueChange={(details) => setActiveTab(details.value)}>
        <Tabs.List gap={2} mb={4}>
          <Tabs.Trigger
            value="group-members"
            px={4}
            py={2}
            borderRadius="md"
          >
            Group Members ({selectedMembers.size} of {invitableMembers.length})
          </Tabs.Trigger>
          <Tabs.Trigger
            value="external-emails"
            px={4}
            py={2}
            borderRadius="md"
          >
            External Emails ({externalEmailCount})
          </Tabs.Trigger>
        </Tabs.List>

        {/* Group Members Tab */}
        <Tabs.Content value="group-members">
          <VStack gap={4} align="stretch">
            {loading ? (
              <Box textAlign="center" py={8}>
                <Spinner size="lg" />
                <Text mt={4}>Loading group members...</Text>
              </Box>
            ) : (
              <>
                {/* Stats & Actions */}
                <HStack justify="space-between" p={3} bg="gray.50" borderRadius="md">
                  <VStack align="start" gap={1}>
                    <Text fontSize="sm" color="gray.600">
                      {invitableMembers.length} members can be invited
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {selectedMembers.size} selected
                    </Text>
                  </VStack>

                  <HStack>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSelectAll}
                      disabled={invitableMembers.length === 0}
                    >
                      {selectedMembers.size === invitableMembers.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSendInvitations}
                      loading={isInviting}
                      loadingText="Sending..."
                      disabled={selectedMembers.size === 0}
                    >
                      Send Invitations ({selectedMembers.size})
                    </Button>
                  </HStack>
                </HStack>

                {/* Members List */}
                <VStack gap={2} align="stretch" maxH="400px" overflowY="auto">
                  {groupMembers.map((member) => {
                    const canInvite = member.subscription_status === 'never_invited' ||
                                    member.subscription_status === 'unsubscribed';
                    const isSelected = selectedMembers.has(member.id);

                    return (
                      <Box
                        key={member.id}
                        p={3}
                        borderWidth={1}
                        borderRadius="md"
                        bg={isSelected ? "blue.50" : "white"}
                        borderColor={isSelected ? "blue.200" : "gray.200"}
                      >
                        <HStack justify="space-between">
                                                      <HStack gap={3}>
                            {canInvite && (
                              <Checkbox.Root
                                checked={isSelected}
                                onCheckedChange={() => handleMemberToggle(member.id)}
                              >
                                <Checkbox.HiddenInput />
                                <Checkbox.Control>
                                  <Checkbox.Indicator />
                                </Checkbox.Control>
                              </Checkbox.Root>
                            )}
                            <Avatar.Root size="sm">
                              <Avatar.Image src={member.avatar} />
                              <Avatar.Fallback>{member.name}</Avatar.Fallback>
                            </Avatar.Root>
                            <VStack align="start" gap={0}>
                              <Text fontWeight="medium">{member.name}</Text>
                              <Text fontSize="sm" color="gray.600">{member.email}</Text>
                              {member.invited_at && (
                                <Text fontSize="xs" color="gray.500">
                                  Invited: {new Date(member.invited_at).toLocaleDateString()}
                                </Text>
                              )}
                            </VStack>
                          </HStack>

                          <VStack align="end" gap={1}>
                            {getStatusBadge(member.subscription_status)}
                            {!canInvite && (
                              <Text fontSize="xs" color="gray.500">
                                {member.subscription_status === 'subscribed' ? 'Already subscribed' : 'Invitation pending'}
                              </Text>
                            )}
                          </VStack>
                        </HStack>
                      </Box>
                    );
                  })}
                </VStack>
              </>
            )}
          </VStack>
        </Tabs.Content>

        {/* External Emails Tab */}
        <Tabs.Content value="external-emails">
          <VStack gap={4} align="stretch">
            <Box>
              <Text fontWeight="medium" mb={2}>Email Addresses</Text>
              <Text fontSize="sm" color="gray.600" mb={3}>
                Enter email addresses separated by commas, semicolons, or new lines
              </Text>
              <Textarea
                value={externalEmails}
                onChange={(e) => setExternalEmails(e.target.value)}
                placeholder="user1@example.com, user2@example.com&#10;user3@example.com"
                rows={3}
              />
              <Text fontSize="xs" color="gray.500" mt={2}>
                These users will receive double opt-in emails to confirm their subscription
              </Text>
            </Box>

            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600">
                {externalEmailCount} valid email addresses ready to invite
              </Text>
              <Button
                  size="sm"
                  variant="outline"
                  disabled={true}
                >
                  Import from CSV...
              </Button>

              <Button
                onClick={handleSendInvitations}
                loading={isInviting}
                loadingText="Sending..."
                disabled={externalEmailCount === 0}
              >
                Send Invitations ({externalEmailCount})
              </Button>
            </HStack>
          </VStack>
        </Tabs.Content>
      </Tabs.Root>

      <Divider />


      <HStack justify="space-between">
        <Button variant="outline" onClick={onBack}>
          Cancel
        </Button>

        {hasPendingInvitations && showDoneConfirmation ? (
          <HStack gap={2}>
            <Text fontSize="sm" color="orange.600" fontWeight="medium">
              You have unsent invitations!
            </Text>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDoneConfirmation(false)}
            >
              Keep Editing
            </Button>
            <Button
              colorScheme="red"
              size="sm"
              onClick={onComplete}
            >
              Discard & Close
            </Button>
          </HStack>
        ) : (
          <Button
            // colorScheme={hasPendingInvitations ? "orange" : "green"}
            onClick={handleDone}
          >
            {hasPendingInvitations ? "Done (Unsent Invitations!)" : "Done"}
          </Button>
        )}
      </HStack>
    </VStack>
  );
}



// // src/components/lantern/AddSubscribersView.tsx

// "use client";

// import { useState, useEffect } from "react";
// import {
//   VStack,
//   HStack,
//   Text,
//   Button,
//   Tabs,
//   Box,
//   Input,
//   Textarea,
//   Checkbox,
//   Badge,
//   Avatar,
//   Spinner,
// } from "@chakra-ui/react";
// import { Divider } from "@components/common/Divider";
// import { LanternMailList } from "content/lanternTypes";
// import { useLanternmail } from "@hooks/useLanternmail";
// import { ErrorAlert, } from "@components/ui/alerts/ErrorAlert";
// import { SuccessAlert } from "@components/ui/alerts/SuccessAlert";
// import { createStandaloneToast } from "@chakra-ui/toast";

// interface Props {
//   list: LanternMailList;
//   onBack: () => void;
//   onComplete: () => void;
// }

// interface GroupMember {
//   id: string;
//   name: string;
//   email: string;
//   avatar?: string;
//   subscription_status: 'subscribed' | 'unsubscribed' | 'pending' | 'never_invited';
//   invited_at?: string;
// }

// export default function AddSubscribersView({ list, onBack, onComplete }: Props) {
//   const { getGroupMembers, sendInvitations, loading } = useLanternmail();
//   const [activeTab, setActiveTab] = useState("group-members");
//   const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
//   const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
//   const [externalEmails, setExternalEmails] = useState("");
//   const [isInviting, setIsInviting] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [successMessage, setSuccessMessage] = useState<string | null>(null);
//   const { toast } = createStandaloneToast();

//   useEffect(() => {
//     fetchGroupMembers();
//   }, []);

//   const fetchGroupMembers = async () => {
//     try {
//       setError(null);
//       const members = await getGroupMembers(list.group_id, list.id);
//       setGroupMembers(members);
//     } catch (err: any) {
//       setError(err.message || "Failed to load group members");
//     }
//   };

//   const handleMemberToggle = (memberId: string) => {
//     const newSelection = new Set(selectedMembers);
//     if (newSelection.has(memberId)) {
//       newSelection.delete(memberId);
//     } else {
//       newSelection.add(memberId);
//     }
//     setSelectedMembers(newSelection);
//   };

//   const handleSelectAll = () => {
//     const invitableMembers = groupMembers.filter(
//       m => m.subscription_status === 'never_invited' || m.subscription_status === 'unsubscribed'
//     );

//     if (selectedMembers.size === invitableMembers.length) {
//       // Deselect all
//       setSelectedMembers(new Set());
//     } else {
//       // Select all invitable
//       setSelectedMembers(new Set(invitableMembers.map(m => m.id)));
//     }
//   };

//   const handleSendInvitations = async () => {
//     setIsInviting(true);
//     setError(null);
//     setSuccessMessage(null);

//     try {
//       let emailsToInvite: string[] = [];

//       if (activeTab === "group-members") {
//         // Get emails of selected members
//         const selectedMemberEmails = groupMembers
//           .filter(m => selectedMembers.has(m.id))
//           .map(m => m.email);
//         emailsToInvite = selectedMemberEmails;
//       } else {
//         // Parse external emails
//         const emails = externalEmails
//           .split(/[\n,;]/)
//           .map(email => email.trim())
//           .filter(email => email && email.includes('@'));
//         emailsToInvite = emails;
//       }

//       if (emailsToInvite.length === 0) {
//         setError("Please select members or enter valid email addresses");
//         return;
//       }

//       const result = await sendInvitations(list.id, emailsToInvite);

//       setSuccessMessage(`Invitations sent to ${emailsToInvite.length} recipients`);
//       toast({
//         title: "Invitations Sent",
//         description: `${emailsToInvite.length} people will receive opt-in emails`,
//         status: "success",
//         duration: 5000,
//         isClosable: true,
//       });

//       // Reset selections
//       setSelectedMembers(new Set());
//       setExternalEmails("");

//       // Refresh member data
//       await fetchGroupMembers();

//     } catch (err: any) {
//       setError(err.message || "Failed to send invitations");
//     } finally {
//       setIsInviting(false);
//     }
//   };

//   const getStatusBadge = (status: string) => {
//     const statusConfig = {
//       subscribed: { color: "green", text: "Subscribed" },
//       unsubscribed: { color: "red", text: "Unsubscribed" },
//       pending: { color: "yellow", text: "Pending" },
//       never_invited: { color: "gray", text: "Not Invited" },
//     };

//     const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.never_invited;
//     return <Badge colorScheme={config.color}>{config.text}</Badge>;
//   };

//   const invitableMembers = groupMembers.filter(
//     m => m.subscription_status === 'never_invited' || m.subscription_status === 'unsubscribed'
//   );

//   // Count valid external emails
//   const validExternalEmails = externalEmails
//     .split(/[\n,;]/)
//     .map(email => email.trim())
//     .filter(email => email && email.includes('@'));

//   const externalEmailCount = validExternalEmails.length;

//   return (
//     <VStack gap={4} align="stretch">
//       {/* Header */}
//       <HStack justify="space-between">
//         <Button variant="ghost" onClick={onBack}>
//           ← Back to Details
//         </Button>
//         <Text fontSize="lg" fontWeight="bold">
//           Add Subscribers to {list.display_name}
//         </Text>
//       </HStack>

//       {error && <ErrorAlert title="Error" description={error} />}

//       {successMessage && (
//         <SuccessAlert title="Success!" description={successMessage} />
//       )}

//       <Tabs.Root value={activeTab} onValueChange={(details) => setActiveTab(details.value)}>
//         <Tabs.List gap={2} mb={4}>
//           <Tabs.Trigger
//             value="group-members"
//             px={4}
//             py={2}
//             borderRadius="md"
//           >
//             Group Members ({selectedMembers.size} of {invitableMembers.length})
//           </Tabs.Trigger>
//           <Tabs.Trigger
//             value="external-emails"
//             px={4}
//             py={2}
//             borderRadius="md"
//           >
//             External Emails ({externalEmailCount})
//           </Tabs.Trigger>
//         </Tabs.List>

//         {/* Group Members Tab */}
//         <Tabs.Content value="group-members">
//           <VStack gap={4} align="stretch">
//             {loading ? (
//               <Box textAlign="center" py={8}>
//                 <Spinner size="lg" />
//                 <Text mt={4}>Loading group members...</Text>
//               </Box>
//             ) : (
//               <>
//                 {/* Stats & Actions */}
//                 <HStack justify="space-between" p={3} bg="gray.50" borderRadius="md">
//                   <VStack align="start" gap={1}>
//                     <Text fontSize="sm" color="gray.600">
//                       {invitableMembers.length} members can be invited
//                     </Text>
//                     <Text fontSize="xs" color="gray.500">
//                       {selectedMembers.size} selected
//                     </Text>
//                   </VStack>

//                   <HStack>
//                     <Button
//                       size="sm"
//                       variant="outline"
//                       onClick={handleSelectAll}
//                       disabled={invitableMembers.length === 0}
//                     >
//                       {selectedMembers.size === invitableMembers.length ? 'Deselect All' : 'Select All'}
//                     </Button>
//                     <Button
//                       colorScheme="blue"
//                       size="sm"
//                       onClick={handleSendInvitations}
//                       loading={isInviting}
//                       loadingText="Sending..."
//                       disabled={selectedMembers.size === 0}
//                     >
//                       Send Invitations ({selectedMembers.size})
//                     </Button>
//                   </HStack>
//                 </HStack>

//                 {/* Members List */}
//                 <VStack gap={2} align="stretch" maxH="400px" overflowY="auto">
//                   {groupMembers.map((member) => {
//                     const canInvite = member.subscription_status === 'never_invited' ||
//                                     member.subscription_status === 'unsubscribed';
//                     const isSelected = selectedMembers.has(member.id);

//                     return (
//                       <Box
//                         key={member.id}
//                         p={3}
//                         borderWidth={1}
//                         borderRadius="md"
//                         bg={isSelected ? "blue.50" : "white"}
//                         borderColor={isSelected ? "blue.200" : "gray.200"}
//                       >
//                         <HStack justify="space-between">
//                                                       <HStack gap={3}>
//                             {canInvite && (
//                               <Checkbox.Root
//                                 checked={isSelected}
//                                 onCheckedChange={() => handleMemberToggle(member.id)}
//                               >
//                                 <Checkbox.HiddenInput />
//                                 <Checkbox.Control>
//                                   <Checkbox.Indicator />
//                                 </Checkbox.Control>
//                               </Checkbox.Root>
//                             )}
//                             <Avatar.Root size="sm">
//                               <Avatar.Image src={member.avatar} />
//                               <Avatar.Fallback>{member.name}</Avatar.Fallback>
//                             </Avatar.Root>
//                             <VStack align="start" gap={0}>
//                               <Text fontWeight="medium">{member.name}</Text>
//                               <Text fontSize="sm" color="gray.600">{member.email}</Text>
//                               {member.invited_at && (
//                                 <Text fontSize="xs" color="gray.500">
//                                   Invited: {new Date(member.invited_at).toLocaleDateString()}
//                                 </Text>
//                               )}
//                             </VStack>
//                           </HStack>

//                           <VStack align="end" gap={1}>
//                             {getStatusBadge(member.subscription_status)}
//                             {!canInvite && (
//                               <Text fontSize="xs" color="gray.500">
//                                 {member.subscription_status === 'subscribed' ? 'Already subscribed' : 'Invitation pending'}
//                               </Text>
//                             )}
//                           </VStack>
//                         </HStack>
//                       </Box>
//                     );
//                   })}
//                 </VStack>
//               </>
//             )}
//           </VStack>
//         </Tabs.Content>

//         {/* External Emails Tab */}
//         <Tabs.Content value="external-emails">
//           <VStack gap={4} align="stretch">
//             <Box>
//               <Text fontWeight="medium" mb={2}>Email Addresses</Text>
//               <Text fontSize="sm" color="gray.600" mb={3}>
//                 Enter email addresses separated by commas, semicolons, or new lines
//               </Text>
//               <Textarea
//                 value={externalEmails}
//                 onChange={(e) => setExternalEmails(e.target.value)}
//                 placeholder="user1@example.com, user2@example.com&#10;user3@example.com"
//                 rows={6}
//               />
//               <Text fontSize="xs" color="gray.500" mt={2}>
//                 These users will receive double opt-in emails to confirm their subscription
//               </Text>
//             </Box>

//             <HStack justify="space-between">
//               <Text fontSize="sm" color="gray.600">
//                 {externalEmailCount} valid email addresses ready to invite
//               </Text>

//               <Button
//                 colorScheme="blue"
//                 onClick={handleSendInvitations}
//                 loading={isInviting}
//                 loadingText="Sending..."
//                 disabled={!externalEmails.trim()}
//               >
//                 Send Invitations ({externalEmailCount})
//               </Button>
//             </HStack>
//           </VStack>
//         </Tabs.Content>
//       </Tabs.Root>

//       <Divider />

//       <HStack justify="space-between">
//         <Button variant="outline" onClick={onBack}>
//           Cancel
//         </Button>
//         <Button colorScheme="green" onClick={onComplete}>
//           Done
//         </Button>
//       </HStack>
//     </VStack>
//   );
// }

// // // src/components/lantern/AddSubscribersView.tsx

// // "use client";

// // import { useState, useEffect } from "react";
// // import {
// //   VStack,
// //   HStack,
// //   Text,
// //   Button,
// //   Tabs,
// //   Box,
// //   Textarea,
// //   Checkbox,
// //   Badge,
// //   Avatar,
// //   Spinner,
// // } from "@chakra-ui/react";
// // import { LanternMailList } from "content/lanternTypes";
// // import { useLanternmail } from "@hooks/useLanternmail";
// // import { ErrorAlert, } from "@components/ui/alerts/ErrorAlert";
// // import { createStandaloneToast } from "@chakra-ui/toast";
// // import { Divider } from "@components/common/Divider";
// // import { SuccessAlert } from "@components/ui/alerts/SuccessAlert";

// // interface Props {
// //   list: LanternMailList;
// //   onBack: () => void;
// //   onComplete: () => void;
// // }

// // interface GroupMember {
// //   id: string;
// //   name: string;
// //   email: string;
// //   avatar?: string;
// //   subscription_status: 'subscribed' | 'unsubscribed' | 'pending' | 'never_invited';
// //   invited_at?: string;
// // }

// // export default function AddSubscribersView({ list, onBack, onComplete }: Props) {
// //   const { getGroupMembers, sendInvitations, loading } = useLanternmail();
// //   const [activeTab, setActiveTab] = useState("group-members");
// //   const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
// //   const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
// //   const [externalEmails, setExternalEmails] = useState("");
// //   const [isInviting, setIsInviting] = useState(false);
// //   const [error, setError] = useState<string | null>(null);
// //   const [successMessage, setSuccessMessage] = useState<string | null>(null);
// //   const { toast } = createStandaloneToast();

// //   useEffect(() => {
// //     fetchGroupMembers();
// //   }, []);

// //   const fetchGroupMembers = async () => {
// //     try {
// //       setError(null);
// //       const members = await getGroupMembers(list.group_id, list.id);
// //       setGroupMembers(members);
// //     } catch (err: any) {
// //       setError(err.message || "Failed to load group members");
// //     }
// //   };

// //   const handleMemberToggle = (memberId: string) => {
// //     const newSelection = new Set(selectedMembers);
// //     if (newSelection.has(memberId)) {
// //       newSelection.delete(memberId);
// //     } else {
// //       newSelection.add(memberId);
// //     }
// //     setSelectedMembers(newSelection);
// //   };

// //   const handleSelectAll = () => {
// //     const invitableMembers = groupMembers.filter(
// //       m => m.subscription_status === 'never_invited' || m.subscription_status === 'unsubscribed'
// //     );

// //     if (selectedMembers.size === invitableMembers.length) {
// //       // Deselect all
// //       setSelectedMembers(new Set());
// //     } else {
// //       // Select all invitable
// //       setSelectedMembers(new Set(invitableMembers.map(m => m.id)));
// //     }
// //   };

// //   const handleSendInvitations = async () => {
// //     setIsInviting(true);
// //     setError(null);
// //     setSuccessMessage(null);

// //     try {
// //       let emailsToInvite: string[] = [];

// //       if (activeTab === "group-members") {
// //         // Get emails of selected members
// //         const selectedMemberEmails = groupMembers
// //           .filter(m => selectedMembers.has(m.id))
// //           .map(m => m.email);
// //         emailsToInvite = selectedMemberEmails;
// //       } else {
// //         // Parse external emails
// //         const emails = externalEmails
// //           .split(/[\n,;]/)
// //           .map(email => email.trim())
// //           .filter(email => email && email.includes('@'));
// //         emailsToInvite = emails;
// //       }

// //       if (emailsToInvite.length === 0) {
// //         setError("Please select members or enter valid email addresses");
// //         return;
// //       }

// //       const result = await sendInvitations(list.id, emailsToInvite);

// //       setSuccessMessage(`Invitations sent to ${emailsToInvite.length} recipients`);
// //       toast({
// //         title: "Invitations Sent",
// //         description: `${emailsToInvite.length} people will receive opt-in emails`,
// //         status: "success",
// //         duration: 5000,
// //         isClosable: true,
// //       });

// //       // Reset selections
// //       setSelectedMembers(new Set());
// //       setExternalEmails("");

// //       // Refresh member data
// //       await fetchGroupMembers();

// //     } catch (err: any) {
// //       setError(err.message || "Failed to send invitations");
// //     } finally {
// //       setIsInviting(false);
// //     }
// //   };

// //   const getStatusBadge = (status: string) => {
// //     const statusConfig = {
// //       subscribed: { color: "green", text: "Subscribed" },
// //       unsubscribed: { color: "red", text: "Unsubscribed" },
// //       pending: { color: "yellow", text: "Pending" },
// //       never_invited: { color: "gray", text: "Not Invited" },
// //     };

// //     const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.never_invited;
// //     return <Badge colorScheme={config.color}>{config.text}</Badge>;
// //   };

// //   const invitableMembers = groupMembers.filter(
// //     m => m.subscription_status === 'never_invited' || m.subscription_status === 'unsubscribed'
// //   );

// //   return (
// //     <VStack gap={4} align="stretch">
// //       {/* Header */}
// //       <HStack justify="space-between">
// //         <Button variant="ghost" onClick={onBack}>
// //           ← Back to Details
// //         </Button>
// //         <Text fontSize="lg" fontWeight="bold">
// //           Add Subscribers to {list.display_name}
// //         </Text>
// //       </HStack>

// //       {error && <ErrorAlert title="Error" description={error} />}

// //       {successMessage && (
// //         <SuccessAlert title="Success!" description={successMessage} />
// //       )}

// //       <Tabs.Root value={activeTab} onValueChange={(details) => setActiveTab(details.value)}>
// //         <Tabs.List gap={2} mb={4}>
// //           <Tabs.Trigger
// //             value="group-members"
// //             px={4}
// //             py={2}
// //             borderRadius="md"
// //           >
// //             Group Members ({groupMembers.length})
// //           </Tabs.Trigger>
// //           <Tabs.Trigger
// //             value="external-emails"
// //             px={4}
// //             py={2}
// //             borderRadius="md"
// //           >
// //             External Emails
// //           </Tabs.Trigger>
// //         </Tabs.List>

// //         {/* Group Members Tab */}
// //         <Tabs.Content value="group-members">
// //           <VStack gap={4} align="stretch">
// //             {loading ? (
// //               <Box textAlign="center" py={8}>
// //                 <Spinner size="lg" />
// //                 <Text mt={4}>Loading group members...</Text>
// //               </Box>
// //             ) : (
// //               <>
// //                 {/* Stats & Actions */}
// //                 <HStack justify="space-between" p={3} bg="gray.50" borderRadius="md">
// //                   <VStack align="start" gap={1}>
// //                     <Text fontSize="sm" color="gray.600">
// //                       {invitableMembers.length} members can be invited
// //                     </Text>
// //                     <Text fontSize="xs" color="gray.500">
// //                       {selectedMembers.size} selected
// //                     </Text>
// //                   </VStack>

// //                   <HStack>
// //                     <Button
// //                       size="sm"
// //                       variant="outline"
// //                       onClick={handleSelectAll}
// //                       disabled={invitableMembers.length === 0}
// //                     >
// //                       {selectedMembers.size === invitableMembers.length ? 'Deselect All' : 'Select All'}
// //                     </Button>
// //                     <Button
// //                       colorScheme="blue"
// //                       size="sm"
// //                       onClick={handleSendInvitations}
// //                       loading={isInviting}
// //                       loadingText="Sending..."
// //                       disabled={selectedMembers.size === 0}
// //                     >
// //                       Send Invitations ({selectedMembers.size})
// //                     </Button>
// //                   </HStack>
// //                 </HStack>

// //                 {/* Members List */}
// //                 <VStack gap={2} align="stretch" maxH="400px" overflowY="auto">
// //                   {groupMembers.map((member) => {
// //                     const canInvite = member.subscription_status === 'never_invited' ||
// //                                     member.subscription_status === 'unsubscribed';
// //                     const isSelected = selectedMembers.has(member.id);

// //                     return (
// //                       <Box
// //                         key={member.id}
// //                         p={3}
// //                         borderWidth={1}
// //                         borderRadius="md"
// //                         bg={isSelected ? "blue.50" : "white"}
// //                         borderColor={isSelected ? "blue.200" : "gray.200"}
// //                       >
// //                         <HStack justify="space-between">
// //                           <HStack gap={3}>
// //                             {canInvite && (
// //                               <Checkbox.Root
// //                                 checked={isSelected}
// //                                 onCheckedChange={() => handleMemberToggle(member.id)}
// //                               >
// //                                 <Checkbox.HiddenInput />
// //                                 <Checkbox.Control>
// //                                   <Checkbox.Indicator />
// //                                 </Checkbox.Control>
// //                               </Checkbox.Root>
// //                             )}
// //                             <Avatar.Root size="sm">
// //                               <Avatar.Image src={member.avatar} />
// //                               <Avatar.Fallback>{member.name}</Avatar.Fallback>
// //                             </Avatar.Root>
// //                             <VStack align="start" gap={0}>
// //                               <Text fontWeight="medium">{member.name}</Text>
// //                               <Text fontSize="sm" color="gray.600">{member.email}</Text>
// //                               {member.invited_at && (
// //                                 <Text fontSize="xs" color="gray.500">
// //                                   Invited: {new Date(member.invited_at).toLocaleDateString()}
// //                                 </Text>
// //                               )}
// //                             </VStack>
// //                           </HStack>

// //                           <VStack align="end" gap={1}>
// //                             {getStatusBadge(member.subscription_status)}
// //                             {!canInvite && (
// //                               <Text fontSize="xs" color="gray.500">
// //                                 {member.subscription_status === 'subscribed' ? 'Already subscribed' : 'Invitation pending'}
// //                               </Text>
// //                             )}
// //                           </VStack>
// //                         </HStack>
// //                       </Box>
// //                     );
// //                   })}
// //                 </VStack>
// //               </>
// //             )}
// //           </VStack>
// //         </Tabs.Content>

// //         {/* External Emails Tab */}
// //         <Tabs.Content value="external-emails">
// //           <VStack gap={4} align="stretch">
// //             <Box>
// //               <Text fontWeight="medium" mb={2}>Email Addresses</Text>
// //               <Text fontSize="sm" color="gray.600" mb={3}>
// //                 Enter email addresses separated by commas, semicolons, or new lines
// //               </Text>
// //               <Textarea
// //                 value={externalEmails}
// //                 onChange={(e) => setExternalEmails(e.target.value)}
// //                 placeholder="user1@example.com, user2@example.com&#10;user3@example.com"
// //                 rows={6}
// //               />
// //               <Text fontSize="xs" color="gray.500" mt={2}>
// //                 These users will receive double opt-in emails to confirm their subscription
// //               </Text>
// //             </Box>

// //             <HStack justify="space-between">
// //               <Text fontSize="sm" color="gray.600">
// //                 {externalEmails.split(/[\n,;]/).filter(email =>
// //                   email.trim() && email.includes('@')
// //                 ).length} valid email addresses
// //               </Text>

// //               <Button
// //                 colorScheme="blue"
// //                 onClick={handleSendInvitations}
// //                 loading={isInviting}
// //                 loadingText="Sending..."
// //                 disabled={!externalEmails.trim()}
// //               >
// //                 Send Invitations
// //               </Button>
// //             </HStack>
// //           </VStack>
// //         </Tabs.Content>
// //       </Tabs.Root>

// //       <Divider />

// //       <HStack justify="space-between">
// //         <Button variant="outline" onClick={onBack}>
// //           Cancel
// //         </Button>
// //         <Button colorScheme="green" onClick={onComplete}>
// //           Done
// //         </Button>
// //       </HStack>
// //     </VStack>
// //   );
// // }