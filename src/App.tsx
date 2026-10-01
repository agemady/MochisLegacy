import { Suspense, lazy, useEffect, useState } from "react";
import Hero from "./components/Hero";
import Footer from "./components/Footer";
import SignupModal, { type SignupKind } from "./components/forms/SignupModal";
import Roster from "./components/Roster";

// Scheduler routes are lazy so the landing bundle stays small.
const SchedulePage = lazy(() => import("./components/schedule/SchedulePage"));
const AdminPage = lazy(() => import("./components/admin/AdminPage"));

/**
 * App composition (pane w2:p1) — ruling 7 single-screen landing.
 *
 * Hero / Footer are chrome owned here (Header removed — see p9's Header cut).
 * The Hero's three buttons
 * open p4's SignupModal (owned by pane w2:p4) with exactly one form at a
 * time; the legacy Mission / DogSquad / SignupTabs sections are dropped from
 * the composition and are removed from the tree by p4 after this lands.
 */
export default function App() {
  const [kind, setKind] = useState<SignupKind | null>(null);

  // Flyer QR deep links: /#dog, /#volunteer, /#pledge open the matching form.
  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.slice(1);
      if (h === "dog" || h === "volunteer" || h === "pledge") setKind(h);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);
  const closeSignup = () => {
    setKind(null);
    history.replaceState(null, "", window.location.pathname + window.location.search);
  };

  // Unlisted dog-roster page — no nav link from the landing (ruling 7).
  const pathname = window.location.pathname.replace(/\/+$/, "");
  if (pathname === "/roster") {
    return <Roster />;
  }

  // Scheduler routes. Personal links carry their key in the fragment
  // (`/schedule#k=…`, `/checkin#k=…`); src/lib/key.ts moves it to storage.
  if (pathname === "/schedule") {
    return (
      <Suspense fallback={null}>
        <SchedulePage />
      </Suspense>
    );
  }
  if (pathname === "/checkin" || pathname === "/admin") {
    return (
      <Suspense fallback={null}>
        <AdminPage />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen">
      <main>
        <Hero onOpen={setKind} />
      </main>
      <Footer />
      <SignupModal kind={kind} onClose={closeSignup} />
    </div>
  );
}
