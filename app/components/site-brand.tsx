import Link from "next/link";
import UiIcon from "./ui-icon";

export default function SiteBrand({
  className = "brand",
}: {
  className?: string;
}) {
  return (
    <Link className={className} href="/" aria-label="Second View home">
      <span className="brand-mark"><UiIcon name="eye" size="md" /></span>
      <span>Second View</span>
    </Link>
  );
}
