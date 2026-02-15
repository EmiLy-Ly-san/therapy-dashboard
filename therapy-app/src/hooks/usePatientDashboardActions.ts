import { useRouter } from 'expo-router';

export default function usePatientDashboardActions() {
  const router = useRouter();

  function goToWritePage() {
    router.push('/(patient)/write');
  }

  function goToLibraryPage() {
    router.push('/(patient)/library');
  }

  function pickFile() {
    console.log('Choisir un fichier (à faire)');
  }

  return {
    goToWritePage,
    goToLibraryPage,
    pickFile,
  };
}
