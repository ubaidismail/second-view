import Link from "next/link";

export default function SiteBrand({
  className = "brand",
}: {
  className?: string;
}) {
  return (
    <Link className={className} href="/" aria-label="Second View home">
      <span className="brand-mark">◇</span>
      <span>Second View</span>
    </Link>
  );
}
