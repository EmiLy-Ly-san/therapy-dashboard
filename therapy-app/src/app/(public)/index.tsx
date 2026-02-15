import { Text, View, Platform } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, Button } from '../../components/ui';
import { colors } from '../../constants';

function GradientTitle({ children }: { children: string }) {
  const isWeb = Platform.OS === 'web';

  if (!isWeb) {
    // Mobile fallback (pas de gradient)
    return (
      <Text
        style={{
          fontSize: 48,
          fontWeight: '900',
          textAlign: 'center',
          color: colors.primary,
        }}
      >
        {children}
      </Text>
    );
  }

  // Web gradient version
  return (
    <Text
      style={
        {
          fontSize: 48,
          fontWeight: '900',
          textAlign: 'center',
          backgroundImage: `linear-gradient(90deg, ${colors.primary}, #7C3AED)`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        } as any
      }
    >
      {children}
    </Text>
  );
}

export default function PublicHomePage() {
  const router = useRouter();

  function handleGoToLogin() {
    router.push('/(public)/login' as any);
  }

  return (
    <Screen centered style={{ justifyContent: 'center' }}>
      {/* TITLE */}
      <GradientTitle>Therapy Dashboard</GradientTitle>

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
