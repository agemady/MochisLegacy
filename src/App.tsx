import Header from "./components/Header";
import Hero from "./components/Hero";
import Mission from "./components/Mission";
import DogSquad from "./components/DogSquad";
import SignupTabs from "./components/forms/SignupTabs";
import Footer from "./components/Footer";

/**
 * App composition (pane w2:p1).
 *
 * Header / Hero / Footer are chrome, owned here. Mission and DogSquad are
 * owned by pane w2:p4 and are wired in below (their section ids #mission and
 * #squad are baked into the components). SignupTabs (p4, src/components/forms)
 * renders the #signup section itself — three tabbed forms plus the newsletter
 * card — so no local placeholder is needed.
 */
export default function App() {
  return (
    <div className="min-h-screen bg-amber-50 text-stone-800">
      <Header />
      <main>
        <Hero />

        <Mission />
        <DogSquad />
        <SignupTabs />
      </main>
      <Footer />
    </div>
  );
}
