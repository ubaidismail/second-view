import Link from "next/link";
import AuthActions from "./auth-actions";
import SiteBrand from "./site-brand";

export default function SiteHeader({ active = "" }: { active?: string }) {
  return (
    <header className="app-header">
      <SiteBrand />
      <nav aria-label="Main navigation">
        <Link className={active === "feed" ? "current" : ""} href="/feed">
          Feed
        </Link>
        <Link className={active === "profile" ? "current" : ""} href="/profile">
          My profile
        </Link>
        <Link
          className={active === "mentor" ? "current" : ""}
          href="/mentor-apply"
        >
          For mentors
        </Link>
      </nav>
      <AuthActions />
    </header>
  );
}
