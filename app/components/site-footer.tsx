import Link from "next/link";
import SiteBrand from "./site-brand";

export default function SiteFooter({
  variant = "app",
}: {
  variant?: "app" | "marketing";
}) {
  return (
    <footer className="footer">
      <SiteBrand />
      <nav>
        {variant === "marketing" ? (
          <>
            <a href="#how-it-works">How it works</a>
            <a href="#mentors">Mentors</a>
            <Link href="/login">Sign in</Link>
          </>
        ) : (
          <>
            <Link href="/feed">Feed</Link>
            <Link href="/profile">My profile</Link>
            <Link href="/mentor-apply">Mentors</Link>
            <Link href="/login">Sign in</Link>
          </>
        )}
      </nav>
    </footer>
  );
}
