import { Text, View, Image } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, Button } from '../../components/ui';
import { colors } from '../../constants';

export default function PublicHomePage() {
  const router = useRouter();

  function handleGoToLogin() {
    router.push('/(public)/login' as any);
  }

  return (
    <Screen centered style={{ justifyContent: 'center' }}>
      {/* LOGO IMAGE */}
      <View style={{ alignItems: 'center' }}>
        <Image
          source={require('../../assets/images/therapy-dashboard-big.svg')}
          style={{ width: 320, height: 90 }}
          resizeMode="contain"
        />
      </View>

      {/* TAGLINE */}
      <Text
        style={{
          marginTop: 20,
          fontSize: 16,
          textAlign: 'center',
          color: colors.textSecondary,
          maxWidth: 600,
          lineHeight: 24,
        }}
      >
        Une plateforme moderne et sécurisée pour connecter patients et
        thérapeutes, partager des ressources et accompagner les parcours
        thérapeutiques.
      </Text>

      {/* CTA */}
      <View style={{ marginTop: 40 }}>
        <Button title="Se connecter" onPress={handleGoToLogin} />
      </View>
    </Screen>
  );
}
