import { useState } from 'react';
import { Text, View, Switch, Platform } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, Card, Button, Input } from '../../components/ui';
import { colors } from '../../constants';

export default function PatientDashboardPage() {
  const router = useRouter();

  const [isPrivateModeEnabled, setIsPrivateModeEnabled] = useState(false);

  const isWeb = Platform.OS === 'web';

  function handleSearchChange(textValue: string) {
    console.log('Recherche:', textValue);
  }

  function handleWriteTodayPress() {
    router.push('/(patient)/write');
  }

  function handlePickFilePress() {
    console.log('Choisir un fichier (à faire)');
  }

  function handlePrivateModeToggle(nextValue: boolean) {
    setIsPrivateModeEnabled(nextValue);
    console.log('Mode privé:', nextValue ? 'ON' : 'OFF');
  }

  function handleGoToLibraryPress() {
    router.push('/(patient)/library');
  }

  return (
    <Screen>
      <View
        style={{
          width: '100%',
          maxWidth: isWeb ? 720 : '100%',
          alignSelf: 'center',
          gap: 24,
        }}
      >
        {/* HEADER */}
        <View>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '800',
              color: colors.textPrimary,
            }}
          >
            Dashboard
          </Text>

          <Text style={{ marginTop: 6, color: colors.textSecondary }}>
            Espace patient
          </Text>
        </View>

        {/* SEARCH */}
        <Input
          placeholder="Rechercher (notes, fichiers…)"
          onChangeText={handleSearchChange}
        />

        {/* MAIN ACTION */}
        <Card>
          <View style={{ gap: 12 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: colors.textPrimary,
              }}
            >
              ✍️ Écrire aujourd’hui
            </Text>

            <Text style={{ color: colors.textSecondary }}>
              Exprime un ressenti, une pensée ou un souvenir.
            </Text>

            <Button
              title="Commencer une entrée"
              onPress={handleWriteTodayPress}
            />
          </View>
        </Card>

        {/* LIBRARY */}
        <Card>
          <View style={{ gap: 12 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: colors.textPrimary,
              }}
            >
              📚 Mes contenus
            </Text>

            <Text style={{ color: colors.textSecondary }}>
              Retrouve tous tes textes et fichiers au même endroit.
            </Text>

            <Button
              title="Voir tous mes contenus"
              onPress={handleGoToLibraryPress}
            />
          </View>
        </Card>

        {/* ADD DOCUMENT */}
        <Card>
          <View style={{ gap: 12 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: colors.textPrimary,
              }}
            >
              📎 Ajouter un document
            </Text>

            <Text style={{ color: colors.textSecondary }}>
              Photo, audio ou fichier à partager dans ton espace.
            </Text>

            <Button title="Choisir un fichier" onPress={handlePickFilePress} />
          </View>
        </Card>

        {/* PRIVATE MODE */}
        <Card>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View>
              <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
                🔒 Mode privé
              </Text>

              <Text style={{ marginTop: 4, color: colors.textSecondary }}>
                Visible uniquement par moi
              </Text>
            </View>

            <Switch
              value={isPrivateModeEnabled}
              onValueChange={handlePrivateModeToggle}
            />
          </View>
        </Card>
      </View>
    </Screen>
  );
}
