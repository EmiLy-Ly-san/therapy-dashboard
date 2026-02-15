import { Stack } from 'expo-router';
import 'react-native-url-polyfill/auto';
// Ce polyfill ajoute certaines fonctions web (URL, atob, etc.)
// qui ne sont pas toujours disponibles en React Native.
// Supabase en a besoin pour gérer correctement les uploads et les URLs,
// surtout sur mobile.
// On le met ici (dans le layout racine) pour qu’il soit chargé
// une seule fois au démarrage de l’application.

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(public)" />
      <Stack.Screen name="(patient)" />
      <Stack.Screen name="(therapist)" />
    </Stack>
  );
}
