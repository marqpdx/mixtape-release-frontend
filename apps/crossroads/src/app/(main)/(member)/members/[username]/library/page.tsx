import { redirect } from "next/navigation";

export default async function MemberLibraryIndexPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  redirect(`/members/${username}?tab=writing`);
}
