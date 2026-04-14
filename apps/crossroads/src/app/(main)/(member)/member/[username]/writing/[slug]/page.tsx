import { redirect } from "next/navigation";

export default async function DeprecatedMemberWritingPage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}) {
  const { username, slug } = await params;
  redirect(`/members/${username}/writing/${slug}`);
}
