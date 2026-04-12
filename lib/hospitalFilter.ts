import { getSession } from '@/lib/session';

/**
 * Returns a MongoDB filter object that restricts queries by hospital.
 * Admin sees all hospitals. Other roles see only their own hospital's data.
 */
export async function getHospitalFilter(): Promise<Record<string, unknown>> {
  const session = await getSession();
  if (!session) return {};

  // Admin sees everything
  if (session.user.role === 'admin') return {};

  // Other roles see only their hospital
  if (session.user.hospital) {
    return { hospital: session.user.hospital };
  }

  // No hospital assigned — see all (backward compat)
  return {};
}
