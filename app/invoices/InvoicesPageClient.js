"use client";

import React, { useState, useEffect } from "react";
import UniversalTopBar from "@/components/UniversalTopBar";
import InvoicingView from "@/components/InvoicingView";
import { supabase } from "@/lib/supabase";
import { fetchUserProfile } from "@/lib/db";
import { useRouter } from "next/navigation";

export default function InvoicesPageClient() {
  const [currentUser, setCurrentUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        fetchUserProfile(user.id).then((prof) => {
          setCurrentUser(prof || user);
        });
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <UniversalTopBar
        currentUser={currentUser}
        onGoToHome={() => router.push("/")}
        onOpenEventsHub={() => router.push("/?view=events-hub")}
        onOpenProfile={() => router.push("/?view=profile")}
        onSignOut={async () => {
          await supabase.auth.signOut();
          setCurrentUser(null);
          router.push("/");
        }}
      />
      <main className="flex-1">
        <InvoicingView currentUser={currentUser} />
      </main>
    </div>
  );
}
