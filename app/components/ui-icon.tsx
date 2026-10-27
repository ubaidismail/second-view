import type { SVGProps } from "react";
import {
  ArrowPathIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  ArrowUpTrayIcon,
  BriefcaseIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  EnvelopeIcon,
  EyeIcon,
  FingerPrintIcon,
  HeartIcon,
  LockClosedIcon,
  PlusIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Squares2X2Icon,
  UserCircleIcon,
  UserGroupIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

const icons = {
  "arrow-path": ArrowPathIcon,
  "arrow-right": ArrowRightIcon,
  "arrow-up-right": ArrowUpRightIcon,
  "arrow-up-tray": ArrowUpTrayIcon,
  briefcase: BriefcaseIcon,
  "check-badge": CheckBadgeIcon,
  "check-circle": CheckCircleIcon,
  check: CheckIcon,
  clock: ClockIcon,
  envelope: EnvelopeIcon,
  eye: EyeIcon,
  fingerprint: FingerPrintIcon,
  heart: HeartIcon,
  lock: LockClosedIcon,
  plus: PlusIcon,
  "shield-check": ShieldCheckIcon,
  sparkles: SparklesIcon,
  "squares-2x2": Squares2X2Icon,
  "user-circle": UserCircleIcon,
  "user-group": UserGroupIcon,
  user: UserIcon,
} as const;

export type IconName = keyof typeof icons;

type UiIconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: "xs" | "sm" | "md" | "lg";
};

export default function UiIcon({
  name,
  size = "sm",
  className = "",
  ...props
}: UiIconProps) {
  const Icon = icons[name];
  const classes = ["ui-icon", `ui-icon-${size}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <Icon
      aria-hidden="true"
      focusable="false"
      className={classes}
      {...props}
    />
  );
}
