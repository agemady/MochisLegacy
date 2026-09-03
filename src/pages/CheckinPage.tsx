import { useEffect, useState } from "react";
import { useSession } from "../lib/auth";
import { getSupabase } from "../lib/supabase";
import SignIn from "../components/SignIn";
import PageTop from "../components/PageTop";

/**
 * /checkin — admin-gated day-of check-in shell (slice S-shell, pane w2:p1).
 *
 * Route contract: signed-out visitors get SignIn; signed-in non-admins get a
 * plain notice; admins get the placeholder body that pE's S-checkin-ui
 * (src/components/schedule/CheckinPage.tsx) replaces.
 */
export default function CheckinPage() {
  const { session, loading } = useSession();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsAdmin(null);
    if (!session) {
      setIsAdmin(false);
      return;
    }
    getSupabase().then((client) => {
      if (cancelled || !client) {
        if (!cancelled) setIsAdmin(false);
        return;
      }
      client
        .from("people")
        .select("is_admin")
        .eq("auth_user_id", session.user.id)
        .maybeSingle()
        .then(({ data }: { data: { is_admin: boolean } | null }) => {
          if (!cancelled) setIsAdmin(data?.is_admin === true);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [session]);

  if (loading || (session && isAdmin === null)) {
    return <p className="p-6 text-stone-600">Loading…</p>;
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-md p-6">
        <PageTop />
        <SignIn />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <PageTop />
        <p className="mt-6 text-stone-600">
          Check-in is for walk admins. Ask an admin to add you to the people
          table with is_admin.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <PageTop />
      <h1 className="mt-6 text-xl font-semibold text-stone-800">Day-of check-in</h1>
      <p className="mt-2 text-stone-600">
        The check-in roster UI is being built (slice S-checkin-ui). You are
        signed in as an admin.
      </p>
    </div>
  );
}
