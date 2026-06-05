// src/app/(auth)/invitations/accept/[inviteInfo]/page.tsx

"use client";

import { AcceptInviteForm } from "@/components/groups/invitations/AcceptInviteForm";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";

export default function AcceptInvitePage() {
  const params = useParams();
  const shortcode = (params.inviteInfo as string) || "";
  const { user, isLoading } = useAuth();

  if (!shortcode) {
    return <div>Invalid invitation link</div>;
  }

  if (isLoading) return null;

  // Logged-in users just accept the invite; unauthenticated users register first
  return <AcceptInviteForm shortcode={shortcode} isNewUser={!user} />;
}




// // src/app/(auth)/accept-invite/[inviteInfo]/page.tsx

// "use client";

// import {
//   Box,
//   Button,
//   Heading,
//   Input,
//   Stack,
//   Text,
// } from "@chakra-ui/react";
// import { useForm } from "react-hook-form";
// import { useRouter, useParams } from "next/navigation";
// import { useState } from "react";
// import { createStandaloneToast } from "@chakra-ui/toast";
// import axios from "axios";

// export default function AcceptInvitePage() {
//   const { inviteInfo } = useParams(); // e.g. "66-3-abc123token"
//   const [submitting, setSubmitting] = useState(false);
//   const router = useRouter();

//   const { toast } = createStandaloneToast();

//   const NEXT_PUBLIC_ROOT_API_URL = process.env.NEXT_PUBLIC_ROOT_API_URL ?? "";
//   const acceptInviteUrl = `${NEXT_PUBLIC_ROOT_API_URL}/api/accept-invite`;

//   const {
//     register,
//     handleSubmit,
//     formState: { errors, },
//   } = useForm();

//   // const res = await axios.get(`/api/invite/${inviteCode}`);


//   const onSubmit = async (data: any) => {
//     setSubmitting(true);

//     try {
//       const shortCode = Array.isArray(inviteInfo) ? inviteInfo[0] : inviteInfo;

//       console.log("rawInviteInfo", shortCode);

//       if (!shortCode) throw new Error("Missing invite shortCode");

//       // ✅ Call the resolve endpoint to get invite details
//       const resolveRes = await axios.get(
//         `${NEXT_PUBLIC_ROOT_API_URL}/api/invite/${shortCode}`
//       );

//       const { user_id, group_id, token } = resolveRes.data;

//       console.log("Resolved invite info", { user_id, group_id, token });

//       console.log("data", data);


//       const res = await axios.post(acceptInviteUrl, {
//         user_id,
//         group_id,
//         token,
//         password: data.password,
//         username: data.username,
//         shortcode: shortCode,
//       });

//       console.log("Accept Invite Response", res.data);

//       toast({
//         title: "Welcome!",
//         description: "Your account has been activated.",
//         status: "success",
//         duration: 5000,
//         isClosable: true,
//       });

//       router.push("/login");
//     } catch (err: any) {
//       toast({
//         title: "Invalid or expired invite.",
//         description:
//           err?.response?.data?.detail || "Could not activate your account.",
//         status: "error",
//         duration: 6000,
//         isClosable: true,
//       });
//     } finally {
//       setSubmitting(false);
//     }
//   };






//   // const onSubmit = async (data: any) => {
//   //   setSubmitting(true);

//   //   try {
//   //     // const [user_id, group_id, token] = (Array.isArray(inviteInfo) ? inviteInfo[0] : inviteInfo).split("__");
//   //     const rawInviteInfo = Array.isArray(inviteInfo) ? inviteInfo[0] : inviteInfo;
//   //     if (!rawInviteInfo) throw new Error("Missing invite info");
//   //     const [user_id, group_id, token] = rawInviteInfo.split("__");

//   //     const res = await axios.post(acceptInviteUrl, {
//   //       user_id,
//   //       group_id,
//   //       token,
//   //       password: data.password,
//   //       username: data.username,
//   //     });

//   //     toast({
//   //       title: "Welcome!",
//   //       description: "Your account has been activated.",
//   //       status: "success",
//   //       duration: 5000,
//   //       isClosable: true,
//   //     });

//   //     router.push("/login");
//   //   } catch (err: any) {
//   //     toast({
//   //       title: "Invalid or expired invite.",
//   //       description:
//   //         err?.response?.data?.detail || "Could not activate your account.",
//   //       status: "error",
//   //       duration: 6000,
//   //       isClosable: true,
//   //     });
//   //   } finally {
//   //     setSubmitting(false);
//   //   }
//   // };

//   return (
//     <Box maxW="lg" mx="auto" mt={12} px={4}>
//       <Heading mb={4}>Accept Your Invitation</Heading>
//       <Text color="gray.600" mb={6}>
//         Just set your password below to activate your account and join the group.
//       </Text>

//       <form onSubmit={handleSubmit(onSubmit)}>
//         <Stack gap={4}>
//           <Input
//             type="text"
//             placeholder="Choose a username"
//             {...register("username", {
//               required: true,
//             validate: async (value) => {
//               if (!isValidUsername(value)) return "Only letters, numbers, and _ allowed";
//               if (containsProfanity(value)) return "Inappropriate username";
//               const available = await checkUsernameAvailable(value);
//               return available || "Username already taken";
//             }, })}
//           />
//           {errors.username && (
//             <Box color="red.500" fontSize="sm">
//               {errors.username.message as string}
//             </Box>
//           )}
//           <Input
//             type="password"
//             placeholder="Choose a password"
//             {...register("password", { required: true })}
//           />
//           {/* <Button type="submit" loading={submitting} colorScheme="blue"> */}
//           <Button type="submit" loading={submitting}>
//             Activate Account
//           </Button>
//         </Stack>
//       </form>
//     </Box>
//   );
// }


// const isValidUsername = (username: string) =>
//   /^[a-zA-Z0-9_]{3,20}$/.test(username);


// import { Filter } from 'bad-words';
// import { axiosInstance } from "@providers/auth-provider/axiosInstance";
// const filter = new Filter();

// const containsProfanity = (username: string) => filter.isProfane(username);


// const checkUsernameAvailable = async (username: string) => {
//   try {
//     const res = await axiosInstance.get(`/api/authz/check-username/${username}`);
//     return res.data.available; // assume: { available: true/false }
//   } catch (err) {
//     return false;
//   }
// };