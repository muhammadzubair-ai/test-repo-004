export type Health = {
  status: "ok" | "degraded";
  database: "up" | "down";
  checkedAt: string;
};

export async function checkHealth(ping: () => Promise<unknown>, now = new Date()): Promise<Health> {
  try {
    await ping();
    return { status: "ok", database: "up", checkedAt: now.toISOString() };
  } catch {
    return { status: "degraded", database: "down", checkedAt: now.toISOString() };
  }
}
