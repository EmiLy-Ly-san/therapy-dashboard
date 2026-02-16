import { Alert } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { Button } from '../ui';
import { supabase } from '../../lib/supabase';

type LogoutButtonProps = {
  redirectTo?: Href;
};

export default function LogoutButton({ redirectTo = '/' }: LogoutButtonProps) {
  const router = useRouter();

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert('Erreur', error.message);
      return;
    }

    router.replace(redirectTo);
  }

  return <Button title="Se déconnecter" onPress={handleLogout} />;
}
