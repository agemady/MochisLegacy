import Header from "./components/Header";
import Hero from "./components/Hero";
import Footer from "./components/Footer";

/**
 * App composition (pane w2:p1).
 *
 * Header / Hero / Footer are chrome, owned here. The Mission, DogSquad, and
 * SignupForms sections are owned by pane w2:p4 and land in src/components/.
 * Until they exist, temporary anchor placeholders keep the ids (#mission,
 * #squad, #signup) resolvable and the build green. When p4's components
 * land, replace each <SectionPlaceholder> with its real component.
 */
export default function App() {
  return (
    <div className="min-h-screen bg-amber-50 text-stone-800">
      <Header />
      <main>
        <Hero />

        <SectionPlaceholder id="mission" title="Our Mission" />
        <SectionPlaceholder id="squad" title="Dog Squad" />
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
