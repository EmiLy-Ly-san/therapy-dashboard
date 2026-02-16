/**
 * Hook actions pour le dashboard therapist
 *
 * Objectif :
 * - Centraliser la navigation
 */

import { useRouter } from 'expo-router';

export default function useTherapistDashboardActions() {
  const router = useRouter();

  function goToPatientsPage() {
    router.push('/(therapist)/patients' as any);
  }

  return {
    goToPatientsPage,
  };
}
