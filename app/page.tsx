import Link from "next/link";
import ModerationNotice from "./components/moderation-notice";
import SiteBrand from "./components/site-brand";
import SiteFooter from "./components/site-footer";

const principles = [
  [
    "◉",
    "Pseudonymous sharing",
    "Your community posts use a display name. Your sign-in email is not shown to public readers.",
  ],
  [
    "✓",
    "Manual credential review",
    "Mentor credentials are reviewed before an account can respond.",
  ],
  [
    "✳",
    "Thoughtful, not loud",
    "A slower, more considered space for useful perspectives and small next steps.",
  ],
];

const steps = [
  [
    "01",
    "Unburden yourself",
    "Put the situation into words, at your own pace and under a pseudonym.",
  ],
  [
    "02",
    "Choose a topic",
    "Place your reflection in the channel that best fits what you’re facing.",
  ],
  [
    "03",
    "Wait for a perspective",
    "A credential-reviewed mentor may respond when available.",
  ],
  [
    "04",
    "Keep what helps",
    "Take a practical next step that feels right for you.",
  ],
];

const mentorPaths = [
  [
    "Psychologists",
    "Offer a considered perspective grounded in professional experience.",
  ],
  [
    "Counselors and social workers",
    "Share supportive, practical guidance within clear professional boundaries.",
  ],
  [
    "Executive coaches",
    "Help people reflect on work, leadership, and career transitions.",
  ],
];

export default function Home() {
  return (
    <>
      <header className="topbar">
        <SiteBrand />
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#mentors">For mentors</a>
          <Link href="/feed">Browse reflections</Link>
        </nav>
        <div className="nav-actions">
          <Link className="login-link" href="/login">
            Log in
          </Link>
          <Link
            className="button button-small"
            href="/login?mode=signup&amp;role=mentor"
          >
            Become a mentor <span>↗</span>
          </Link>
        </div>
      </header>
      <main>
        <section className="hero">
          <div className="hero-glow" />
          <div className="eyebrow">
            <span>✧</span> A MORE THOUGHTFUL SECOND OPINION
          </div>
          <h1>
            A place to share
            <br className="desktop-break" /> what weighs on you.
          </h1>
          <p className="hero-copy">
            Some things are easier to face when you can put them into words.
            Share a personal or professional struggle under a pseudonym and
            invite a considered perspective from a credential-reviewed mentor.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/login?mode=signup">
              Share what’s on your mind <span>→</span>
            </Link>
            <Link className="button button-quiet" href="/feed">
              Browse reflections <span>→</span>
            </Link>
          </div>
          <div className="trust-row">
            <span>◉ &nbsp;Pseudonymous public posts</span>
            <span>✓ &nbsp;Mentors reviewed before responding</span>
            <span>♡ &nbsp;Moderated before publication</span>
          </div>
          <section
            className="trust-panel"
            aria-label="How Second View protects the community"
          >
            <article>
              <span>01</span>
              <b>Your email stays private</b>
              <p>
                Public posts show your community name, not your sign-in email.
              </p>
            </article>
            <article>
              <span>02</span>
              <b>Posts are reviewed</b>
              <p>
                Reflections are held for moderation before they can appear in
                the feed.
              </p>
            </article>
            <article>
              <span>03</span>
              <b>Mentors are reviewed</b>
              <p>
                Professional credentials must be checked before mentors can
                respond.
              </p>
            </article>
          </section>
        </section>
        <section className="section principles" id="how-it-works">
          <div className="section-kicker">WHAT MAKES THIS DIFFERENT</div>
          <h2>A space designed for care.</h2>
          <p className="section-intro">
            A quieter way to find perspective—with clear boundaries and people
            who take your trust seriously.
          </p>
          <div className="principle-grid">
            {principles.map(([icon, title, copy]) => (
              <article className="principle-card" key={title}>
                <span className="principle-icon">{icon}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="section steps-section">
          <div className="steps-heading">
            <div>
              <div className="section-kicker">A SIMPLE, DELIBERATE PROCESS</div>
              <h2>Take it one step at a time.</h2>
            </div>
            <p>
              You choose what to share, what kind of perspective you want, and
              what to do next.
            </p>
          </div>
          <div className="steps-grid">
            {steps.map(([number, title, copy]) => (
              <article className="step-card" key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>
                  {number === "03" && <ModerationNotice />} {copy}
                </p>
              </article>
            ))}
          </div>
        </section>
        <section className="section mentor-section" id="mentors">
          <div className="section-kicker">
            FOR PROFESSIONALS WHO WANT TO CONTRIBUTE
          </div>
          <div className="mentor-heading">
            <h2>Experience, offered with care.</h2>
            <Link
              href="/login?mode=signup&amp;role=mentor"
              className="text-link"
            >
              Apply to become a mentor ↗
            </Link>
          </div>
          <p className="section-intro">
            Applications are reviewed manually. Mentors can respond only after
            their credentials have been verified.
          </p>
          <div className="mentor-grid">
            {mentorPaths.map(([title, copy]) => (
              <article className="mentor-card mentor-path-card" key={title}>
                <span className="principle-icon">✓</span>
                <h3>{title}</h3>
                <p>{copy}</p>
                <div className="specialty">Credential review required</div>
              </article>
            ))}
          </div>
        </section>
        <section className="closing-cta">
          <div className="section-kicker">A GENTLER PLACE TO BEGIN</div>
          <h2>You don’t have to figure it all out today.</h2>
          <p>
            Sometimes a thoughtful outside perspective is a good first step.
          </p>
          <Link className="button button-light" href="/login?mode=signup">
            Share what’s on your mind <span>→</span>
          </Link>
        </section>
      </main>
      <SiteFooter variant="marketing" />
    </>
  );
}
