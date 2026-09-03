import Header from "./components/Header";
import Hero from "./components/Hero";
import Mission from "./components/Mission";
import DogSquad from "./components/DogSquad";
import Footer from "./components/Footer";

/**
 * App composition (pane w2:p1).
 *
 * Header / Hero / Footer are chrome, owned here. Mission and DogSquad are
 * owned by pane w2:p4 and are wired in below (their section ids #mission and
 * #squad are baked into the components). The signup forms (#signup) are still
 * pending from p4; a temporary placeholder keeps the id resolvable and the
 * build green until they land.
 */
export default function App() {
  return (
    <div className="min-h-screen bg-amber-50 text-stone-800">
      <Header />
      <main>
        <Hero />

        <Mission />
        <DogSquad />
        <SectionPlaceholder id="signup" title="Sign Up" />
      </main>
      <Footer />
    </div>
  );
}

function SectionPlaceholder({ id, title }: { id: string; title: string }) {
  return (
    <section id={id} className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h2 className="text-2xl font-semibold tracking-tight text-stone-700">
        {title}
      </h2>
      <p className="mt-3 max-w-prose text-stone-500">
        This section is being composed in a parallel pane and will land here
        shortly.
      </p>
    </section>
  );
}
