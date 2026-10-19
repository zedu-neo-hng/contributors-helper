"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthControls() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <span>Loading account...</span>;
  }

  if (!session) {
    return (
      <button
        type="button"
        onClick={() => signIn("google")}
      >
        Continue with Google
      </button>
    );
  }

  return (
    <div>
      <span>
        {session.user?.name ?? session.user?.email}
      </span>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        Sign out
      </button>
    </div>
  );
}