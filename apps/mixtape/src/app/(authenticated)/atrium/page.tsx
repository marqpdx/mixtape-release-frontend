"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";

export default function AtriumRedirect() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.username) {
      router.replace(`/${user.username}/atrium`);
    }
  }, [user, router]);

  return null;
}
