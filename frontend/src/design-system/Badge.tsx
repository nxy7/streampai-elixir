import { type JSX, splitProps } from "solid-js";
import { cn } from "~/design-system/design-system";

export type BadgeVariant =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral"
  | "purple"
  | "pink";
export type BadgeSize = "sm" | "md";

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-green-500/15 text-green-700 dark:text-green-400",
  warning: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  error: "bg-red-500/15 text-red-700 dark:text-red-400",
  info: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  neutral: "bg-surface-inset text-surface-inset-text",
  purple: "bg-primary/15 text-primary",
  pink: "bg-pink-500/15 text-pink-700 dark:text-pink-400",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
};

export interface BadgeProps extends JSX.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: JSX.Element;
}

export default function Badge(props: BadgeProps) {
  const [local, rest] = splitProps(props, [
    "variant",
    "size",
    "children",
    "class",
  ]);

  return (
    <span
      class={cn(
        "inline-flex items-center rounded-full font-medium",
        variantClasses[local.variant ?? "neutral"],
        sizeClasses[local.size ?? "sm"],
        local.class,
      )}
      {...rest}
    >
      {local.children}
    </span>
  );
}
