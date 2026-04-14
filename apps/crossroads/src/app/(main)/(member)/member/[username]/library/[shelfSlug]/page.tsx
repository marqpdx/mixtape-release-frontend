import { redirect } from "next/navigation";

export default async function DeprecatedMemberShelfPage({
  params,
}: {
  params: Promise<{ username: string; shelfSlug: string }>;
}) {
  const { username, shelfSlug } = await params;
  redirect(`/members/${username}/library/${shelfSlug}`);
}
