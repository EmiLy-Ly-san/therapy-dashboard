import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import 'react-native-url-polyfill/auto';
// Ce polyfill ajoute certaines fonctions web (URL, atob, etc.)
// qui ne sont pas toujours disponibles en React Native.
// Supabase en a besoin pour gérer correctement les uploads et les URLs,
// surtout sur mobile.
// On le met ici (dans le layout racine) pour qu’il soit chargé
// une seule fois au démarrage de l’application.

export default function RootLayout() {
  useEffect(() => {
    const run = async () => {
      if (Platform.OS !== 'android') return;

      try {
        await NavigationBar.setBackgroundColorAsync('#FFFFFF');
        await NavigationBar.setButtonStyleAsync('dark');
      } catch (e) {
        console.log('NavigationBar error:', e);
      }
    };

    run();
  }, []);

  return (
    <SafeAreaProvider>
      {/* Haut : icônes (wifi/batterie/heure) */}
      <StatusBar style="dark" backgroundColor="#FFFFFF" />

      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
