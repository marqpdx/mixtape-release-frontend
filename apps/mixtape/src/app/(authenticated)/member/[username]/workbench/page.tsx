// Workbench retired; its Lists live in the Member Hub (Tools → Lists).
import { redirect } from "next/navigation";

export default async function MemberWorkbenchPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  redirect(`/member/${username}/hub?section=lists`);
}
