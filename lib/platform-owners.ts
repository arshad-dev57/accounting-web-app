export const PLATFORM_OWNER_EMAILS = [
  'mfaisalakhan@gmail.com',
  'kashif@gmail.com',
];

export function canViewRegisteredUsers(email?: string | null): boolean {
  return PLATFORM_OWNER_EMAILS.includes(String(email || '').trim().toLowerCase());
}
