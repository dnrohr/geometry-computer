import type { ReactNode } from "react";
export function ScrollConstructionLayout({
  canvas,
  children,
}: {
  canvas: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="scroll-construction-layout">
      <div className="sticky-construction">{canvas}</div>
      <div className="scroll-column">{children}</div>
    </div>
  );
}
