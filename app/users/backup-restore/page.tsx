import { redirect } from 'next/navigation';

/** Backup & Restore moved to Settings. */
export default function UsersBackupRestoreRedirect() {
  redirect('/settings/backup-restore');
}
