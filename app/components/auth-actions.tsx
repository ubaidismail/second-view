"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthActions() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUserId(session?.user.id ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) { setRole(null); return; }
    let active = true;
    void createClient().from("profiles").select("role").eq("id", userId).maybeSingle()
      .then(({ data }) => { if (active) setRole(data?.role ?? null); });
    return () => { active = false; };
  }, [userId]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUserId(null);
    setRole(null);
    router.replace("/");
    router.refresh();
  }

  return <div className="header-actions">{userId ? <>{role === "admin" && <Link href="/admin">Review queue</Link>}<Link href="/profile">My profile</Link><button type="button" className="header-signout" onClick={signOut}>Sign out</button></> : <><Link href="/login">Log in</Link><Link className="button button-small" href="/mentor-apply">Become a mentor <span>↗</span></Link></>}</div>;
}
