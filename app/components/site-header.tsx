import Link from "next/link";
import AuthActions from "./auth-actions";

export default function SiteHeader({ active = "" }: { active?: string }) {
  return <header className="app-header"><Link className="brand" href="/"><span className="brand-mark">◇</span><span>Second View</span></Link><nav aria-label="Main navigation"><Link className={active === "feed" ? "current" : ""} href="/feed">Feed</Link><Link className={active === "profile" ? "current" : ""} href="/profile">Profiles</Link><Link className={active === "mentor" ? "current" : ""} href="/mentor-apply">For mentors</Link></nav><AuthActions/></header>;
}
