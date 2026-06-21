import type { ReactNode } from "react";
export function ScrollStep({
  active,
  children,
  onActivate,
}: {
  active: boolean;
  children: ReactNode;
  onActivate?: () => void;
}) {
  return (
    <section
      className={active ? "scroll-step active" : "scroll-step"}
      aria-current={active ? "step" : undefined}
      onFocus={onActivate}
      onMouseEnter={onActivate}
    >
      {children}
    </section>
  );
}
