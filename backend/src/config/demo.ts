export const DEMO_USER_EMAIL = (
  process.env.DEMO_USER_EMAIL || "demo@quotaforge.dev"
).toLowerCase();

export const DEMO_USER_NAME = "Demo Account";

export function isDemoEmail(email: string) {
  return email.toLowerCase() === DEMO_USER_EMAIL;
}
