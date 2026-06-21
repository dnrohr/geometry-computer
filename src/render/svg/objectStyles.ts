import type { GeomRole } from "../../domain/geometry/types";

export const roleClassName = (role: GeomRole): string =>
  `geometry-object geometry-${role}`;
