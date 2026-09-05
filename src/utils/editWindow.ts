export const EDIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutos AGENTS.md

export function isWithinEditWindow(createdAt: Date, now = new Date()): boolean {
  return createdAt.getTime() + EDIT_WINDOW_MS > now.getTime();
}

export function assertEditWindow({
  createdAt,
  userRole,
  now = new Date(),
}: {
  createdAt: Date;
  userRole: string;
  now?: Date;
}): void {
  // Nutricionista conserva capacidad administrativa (AGENTS.md)
  if (userRole === "nutritionist") return;
  if (!isWithinEditWindow(createdAt, now)) {
    const err = new Error("El registro ya no puede modificarse") as Error & {
      statusCode: number;
    };
    err.statusCode = 403;
    throw err;
  }
}
