import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-url-polyfill/auto';
// Ce polyfill ajoute certaines fonctions web (URL, atob, etc.)
// qui ne sont pas toujours disponibles en React Native.
// Supabase en a besoin pour gérer correctement les uploads et les URLs,
// surtout sur mobile.
// On le met ici (dans le layout racine) pour qu’il soit chargé
// une seule fois au démarrage de l’application.

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
