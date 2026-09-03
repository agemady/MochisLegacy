import { useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Footer from "./components/Footer";
import SignupModal, { type SignupKind } from "./components/forms/SignupModal";
import Roster from "./components/Roster";

/**
 * App composition (pane w2:p1) — ruling 7 single-screen landing.
 *
 * Header / Hero / Footer are chrome, owned here. The Hero's three buttons
 * open p4's SignupModal (owned by pane w2:p4) with exactly one form at a
 * time; the legacy Mission / DogSquad / SignupTabs sections are dropped from
 * the composition and are removed from the tree by p4 after this lands.
 */
export default function App() {
  const [kind, setKind] = useState<SignupKind | null>(null);

  // Unlisted dog-roster page — no nav link from the landing (ruling 7).
  if (window.location.pathname.replace(/\/+$/, "") === "/roster") {
    return <Roster />;
  }

  return (
    <div className="min-h-screen bg-amber-50 text-stone-800">
      <Header />
      <main>
        <Hero onOpen={setKind} />
      </main>
      <Footer />
      <SignupModal kind={kind} onClose={() => setKind(null)} />
    </div>
  );
}
