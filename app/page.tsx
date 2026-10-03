import Link from "next/link";

const principles = [
  ["◉", "Private by design", "Use a generated name in the community. Your public story is kept separate from your account details."],
  ["✓", "Credentials checked", "Mentors are reviewed before they can share professional perspectives."],
  ["✳", "Thoughtful, not loud", "A slower, more considered space for useful perspectives and small next steps."],
];

const steps = [
  ["01", "Unburden yourself", "Put the situation into words, at your own pace and under a pseudonym."],
  ["02", "Choose a perspective", "Select the kind of professional lens that would be useful to you."],
  ["03", "Receive a response", "A verified mentor reads your story and shares a considered perspective."],
  ["04", "Keep what helps", "Take a practical next step that feels right for you."],
];

const mentors = [
  ["JF", "Dr. Julian Foster", "Clinical Psychologist · Ph.D.", "Career transitions, burnout"],
  ["ER", "Elena Rostova", "Board Certified Coach · MCC", "Leadership, imposter feelings"],
  ["MT", "Marcus Thorne", "Licensed Counselor · LCSW", "Grief, relationships"],
];

export default function Home() {
  return (
    <>
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Second View home"><span className="brand-mark">◇</span><span>Second View</span></Link>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a><a href="#mentors">Our mentors</a><a href="#feed">Browse</a>
        </nav>
        <div className="nav-actions"><Link className="login-link" href="/login">Log in</Link><Link className="button button-small" href="/login?mode=signup">Become a mentor <span>↗</span></Link></div>
      </header>
      <aside className="crisis-strip"><span>ⓘ &nbsp;If you may be in immediate danger, contact your local emergency services.</span><a href="tel:988">US: Call or text 988 ↗</a></aside>
      <main>
        <section className="hero">
          <div className="hero-glow" />
          <div className="eyebrow"><span>✧</span> A MORE THOUGHTFUL SECOND OPINION</div>
          <h1>A quiet place to share<br className="desktop-break" /> what weighs on you.</h1>
          <p className="hero-copy">Some things are easier to face when you can say them out loud. Share a personal or professional struggle privately and hear a considered perspective from a verified mentor.</p>
          <div className="hero-actions"><Link className="button" href="/login?mode=signup">Share what’s on your mind <span>→</span></Link><a className="button button-quiet" href="#how-it-works">Explore the community <span>↓</span></a></div>
          <div className="trust-row"><span>◉ &nbsp;Pseudonymous sharing</span><span>✓ &nbsp;Mentors reviewed</span><span>♡ &nbsp;A respectful community</span></div>
          <div className="thread-preview" id="feed">
            <div className="preview-bar"><span className="dots">•••</span><span>Community perspective</span><span className="preview-status">A considered reply</span></div>
            <div className="preview-body">
              <div className="question-card"><div className="meta">ANONYMOUS LARK <span>·</span> CAREER &amp; PURPOSE</div><h2>“I feel like I’ve outgrown the work I worked so hard to get.”</h2><p>I have been successful on paper for years, but lately even the things I used to look forward to feel distant. I’m not sure if I need a change, or just room to breathe.</p></div>
              <article className="answer-card"><div className="mentor-line"><div className="avatar">JF</div><div><strong>Dr. Julian Foster, Ph.D.</strong><small>Clinical Psychologist · Verified Mentor</small></div><span className="verified">✓ Credentials reviewed</span></div><p><b>A different way to frame it.</b> Feeling ready for change does not erase what you have built. It may be useful to treat this as information rather than a verdict, and get curious about what still gives you energy.</p><p><b>A small next step.</b> For one week, notice which parts of your day feel meaningful and which feel draining. You do not need to make a big decision before you understand the pattern.</p><div className="answer-foot"><span>♡ &nbsp;This helped me</span><span>Thoughtful perspective</span></div></article>
            </div>
          </div>
        </section>
        <section className="section principles" id="how-it-works"><div className="section-kicker">WHAT MAKES THIS DIFFERENT</div><h2>A space designed for care.</h2><p className="section-intro">A quieter way to find perspective—with clear boundaries and people who take your trust seriously.</p><div className="principle-grid">{principles.map(([icon, title, copy]) => <article className="principle-card" key={title}><span className="principle-icon">{icon}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
        <section className="section steps-section"><div className="steps-heading"><div><div className="section-kicker">A SIMPLE, DELIBERATE PROCESS</div><h2>Take it one step at a time.</h2></div><p>You choose what to share, what kind of perspective you want, and what to do next.</p></div><div className="steps-grid">{steps.map(([number, title, copy]) => <article className="step-card" key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
        <section className="section mentor-section" id="mentors"><div className="section-kicker">THE PEOPLE BEHIND THE PERSPECTIVES</div><div className="mentor-heading"><h2>Experience, offered with care.</h2><Link href="/login?mode=signup" className="text-link">Become a mentor ↗</Link></div><p className="section-intro">Every mentor is reviewed before joining. Here are a few of the perspectives in our community.</p><div className="mentor-grid">{mentors.map(([initials, name, title, specialty]) => <article className="mentor-card" key={name}><div className="mentor-avatar">{initials}</div><span className="verified">✓ Reviewed</span><h3>{name}</h3><p>{title}</p><div className="specialty">Often helps with</div><div className="tag">{specialty}</div></article>)}</div></section>
        <section className="closing-cta"><div className="section-kicker">A GENTLER PLACE TO BEGIN</div><h2>You don’t have to figure it all out today.</h2><p>Sometimes a thoughtful outside perspective is a good first step.</p><Link className="button button-light" href="/login?mode=signup">Share what’s on your mind <span>→</span></Link></section>
      </main>
      <footer className="footer"><Link className="brand" href="/"><span className="brand-mark">◇</span><span>Second View</span></Link><p>Second View is not emergency care or a substitute for professional treatment. If you are in immediate danger, contact local emergency services. In the US, call or text <a href="tel:988">988</a>.</p><nav><a href="#how-it-works">How it works</a><a href="#mentors">Mentors</a><Link href="/login">Sign in</Link></nav></footer>
    </>
  );
}
