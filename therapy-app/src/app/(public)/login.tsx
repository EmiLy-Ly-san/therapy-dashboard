import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, Card, Input, Button } from '../../components/ui';
import { colors } from '../../constants';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const router = useRouter();

  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  function getRedirectPathFromEmail(email: string) {
    const emailLowerCase = email.toLowerCase();
    const userLooksLikeTherapist =
      emailLowerCase.includes('therapist') || emailLowerCase.includes('psy');

    if (userLooksLikeTherapist) {
      return '/(therapist)/dashboard';
    }

    return '/(patient)/dashboard';
  }

  async function handleLoginButtonPress() {
    setErrorMessage('');

    const cleanEmail = emailValue.trim();

    if (cleanEmail.length === 0) {
      setErrorMessage('Merci de mettre un email.');
      return;
    }

    if (passwordValue.length === 0) {
      setErrorMessage('Merci de mettre un mot de passe.');
      return;
    }

    setIsLoading(true);

    const loginResult = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: passwordValue,
    });

    setIsLoading(false);

    if (loginResult.error) {
      setErrorMessage(loginResult.error.message);
      return;
    }

    const redirectPath = getRedirectPathFromEmail(cleanEmail);
    router.replace(redirectPath as any);
  }

  return (
    <Screen centered style={{ justifyContent: 'center' }}>
      <Text
        style={{ fontSize: 28, fontWeight: '800', color: colors.textPrimary }}
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
            keyboardType="email-address"
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
            title={isLoading ? 'Connexion...' : 'Se connecter'}
            onPress={handleLoginButtonPress}
            isLoading={isLoading}
          />

          {errorMessage.length > 0 ? (
            <Text style={{ marginTop: 6, color: colors.danger }}>
              {errorMessage}
            </Text>
          ) : null}
        </View>
      </Card>
    </Screen>
  );
}
