import { useEffect, useRef } from 'react';
import { Text, View, Image, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, Button } from '../../components/ui';
import { colors } from '../../constants';

export default function PublicHomePage() {
  const router = useRouter();

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(6)).current;

  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(6)).current;

  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo (fade + tiny slide)
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(logoTranslateY, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),

      Animated.delay(80),

      // Tagline
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(taglineTranslateY, {
          toValue: 0,
          duration: 360,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),

      Animated.delay(60),

      // Button
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(buttonTranslateY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  function handleGoToLogin() {
    router.push('/(public)/login' as any);
  }

  return (
    <Screen centered style={{ justifyContent: 'center' }}>
      {/* LOGO IMAGE */}
      <View style={{ alignItems: 'center' }}>
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ translateY: logoTranslateY }],
          }}
        >
          <Image
            source={require('../../assets/images/therapy-dashboard-big.png')}
            style={{ width: 320, height: 90 }}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {/* TAGLINE */}
      <Animated.Text
        style={{
          marginTop: 20,
          fontSize: 16,
          textAlign: 'center',
          color: colors.textSecondary,
          maxWidth: 600,
          lineHeight: 24,
          opacity: taglineOpacity,
          transform: [{ translateY: taglineTranslateY }],
        }}
      >
        Une plateforme moderne et sécurisée pour connecter patients et
        thérapeutes, partager des ressources et accompagner les parcours
        thérapeutiques.
      </Animated.Text>

      {/* CTA */}
      <Animated.View
        style={{
          marginTop: 40,
          opacity: buttonOpacity,
          transform: [{ translateY: buttonTranslateY }],
        }}
      >
        <Button title="Se connecter" onPress={handleGoToLogin} />
      </Animated.View>
    </Screen>
  );
}
