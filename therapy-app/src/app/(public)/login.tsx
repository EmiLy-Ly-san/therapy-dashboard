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

  /**
   * Fallback simple basé sur l'email
   * Utilisé uniquement si aucun rôle n'est trouvé en base. Pour patient@test.com et therapist@test.com
   */
  function getRedirectPathFromEmail(email: string) {
    const emailLowerCase = email.toLowerCase();

    const userLooksLikeTherapist =
      emailLowerCase.includes('therapist') ||
      emailLowerCase.includes('psy') ||
      emailLowerCase.includes('dr');

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

    // 1️. Auth Supabase
    const loginResult = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: passwordValue,
    });

    if (loginResult.error) {
      setIsLoading(false);
      setErrorMessage(loginResult.error.message);
      return;
    }

    /**
     * Logique de redirection :
     *
     * PRIORITÉ :
     * 1. profiles.role en base
     * 2. fallback basé sur l'email (emails de test, comptes incomplets)
     * 3. fallback ultime → patient
     */

    let redirectPath = '/(patient)/dashboard'; // fallback ultime

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (user) {
        // 2️. On cherche le rôle dans la table profiles
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        // CAS NORMAL : profil trouvé avec rôle
        if (!profileError && profile?.role) {
          if (profile.role === 'therapist') {
            redirectPath = '/(therapist)/dashboard';
          } else if (profile.role === 'patient') {
            redirectPath = '/(patient)/dashboard';
          }
        } else {
          /**
           * CAS TEST / DEV :
           * - L'utilisateur existe dans Auth
           * - Mais aucun profil n'est encore créé
           * - Ou le rôle est null
           *
           * On utilise alors le fallback basé sur l'email
           */
          redirectPath = getRedirectPathFromEmail(cleanEmail);
        }
      } else {
        /**
         * CAS TRÈS RARE :
         * Auth OK mais user introuvable
         * → fallback email
         */
        redirectPath = getRedirectPathFromEmail(cleanEmail);
      }
    } catch (e) {
      /**
       * Si erreur DB (ex: profiles table temporairement inaccessible)
       * On garde un comportement stable :
       * fallback email
       */
      console.log('ROLE LOOKUP ERROR', e);
      redirectPath = getRedirectPathFromEmail(cleanEmail);
    }

    setIsLoading(false);

    router.replace(redirectPath as any);
  }

  return (
    <Screen centered style={{ justifyContent: 'center' }}>
      <Text
        style={{
          fontSize: 28,
          fontWeight: '800',
          color: colors.textPrimary,
        }}
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
