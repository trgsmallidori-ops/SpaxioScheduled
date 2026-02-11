const ADMIN_IDS = (process.env.ADMIN_USER_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const CREATOR_ID = (process.env.CREATOR_USER_ID || "").trim();

export function isAdmin(userId: string | undefined): boolean {
  return Boolean(userId && ADMIN_IDS.includes(userId));
}

export function isCreator(userId: string | undefined): boolean {
  return Boolean(userId && CREATOR_ID && userId === CREATOR_ID);
}

export function isCreatorOrAdmin(userId: string | undefined): boolean {
  return isCreator(userId) || isAdmin(userId);
}
