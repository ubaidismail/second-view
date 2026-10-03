import Link from "next/link";

export default function SiteFooter() {
  return <footer className="footer"><Link className="brand" href="/"><span className="brand-mark">◇</span><span>Second View</span></Link><p>Second View is not emergency care or a substitute for professional treatment. If you are in immediate danger, contact local emergency services. In the US, call or text <a href="tel:988">988</a>.</p><nav><Link href="/feed">Feed</Link><Link href="/profile">Profiles</Link><Link href="/mentor-apply">Mentors</Link><Link href="/login">Sign in</Link></nav></footer>;
}
