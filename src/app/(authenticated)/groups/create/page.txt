// /src/app/(protected)/groups/create/page.tsx
"use client";

import { useRouter } from "next/navigation";
import GroupCreateForm from "@components/groups/GroupCreateForm";

export default function GroupCreatePage() {
  const router = useRouter();

  return (
    <GroupCreateForm
      onSuccess={(slug) => {
        router.replace("/groups");
      }}
      onSuccessAndEdit={(slug) => {
        router.replace(`/groups/edit/${slug}`);
      }}
    />
  );
}