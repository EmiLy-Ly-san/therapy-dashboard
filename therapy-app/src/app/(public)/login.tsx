import { useState } from 'react';
import { Text, View, Platform, Alert } from 'react-native';
import { Screen, Card, Input, Button } from '../../components/ui';
import { colors } from '../../constants';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin() {
    setIsLoading(true);

    const loginResult = await supabase.auth.signInWithPassword({
      email: emailValue,
      password: passwordValue,
    });

    setIsLoading(false);

    if (loginResult.error) {
      Alert.alert('Erreur', loginResult.error.message);
    }
  }

  // ✅ Sur web/desktop, on limite la largeur
  const isWeb = Platform.OS === 'web';

  return (
    <Screen style={{ justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          width: '100%',
          maxWidth: isWeb ? 520 : '100%',
        }}
      >
        <Text
          style={{ fontSize: 24, fontWeight: '800', color: colors.textPrimary }}
        >
          Connexion
        </Text>

        <Text style={{ marginTop: 6, color: colors.textSecondary }}>
          Patient ou thérapeute
        </Text>

        <Card style={{ marginTop: 16 }}>
          <View style={{ gap: 10 }}>
            <Input
              placeholder="Email"
              autoCapitalize="none"
              value={emailValue}
              onChangeText={setEmailValue}
            />

            <Input
              placeholder="Mot de passe"
              secureTextEntry
              value={passwordValue}
              onChangeText={setPasswordValue}
            />

            <Button
              title="Se connecter"
              onPress={handleLogin}
              isLoading={isLoading}
            />
          </View>
        </Card>

        {/* Petit helper demo, discret */}
        <Text
          style={{ marginTop: 12, fontSize: 12, color: colors.textSecondary }}
        >
          Astuce : un email contenant “therapist” va vers le dashboard
          thérapeute.
        </Text>
      </View>
    </Screen>
  );
}
