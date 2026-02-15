import { useState } from 'react';
import { Text, View, Switch, Platform } from 'react-native';

import { Screen, Button, Input } from '../../components/ui';
import { colors } from '../../constants';

import DashboardSectionCard from '../../components/dashboard/DashboardSectionCard';
import usePatientDashboardActions from '../../hooks/usePatientDashboardActions';

export default function PatientDashboardPage() {
  const isWeb = Platform.OS === 'web';

  const { goToWritePage, goToLibraryPage, pickFile } =
    usePatientDashboardActions();

  const [isPrivateModeEnabled, setIsPrivateModeEnabled] = useState(false);

  function handleSearchChange(textValue: string) {
    console.log('Recherche:', textValue);
  }

  function handlePrivateModeToggle(nextValue: boolean) {
    setIsPrivateModeEnabled(nextValue);
    console.log('Mode privé:', nextValue ? 'ON' : 'OFF');
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
        <DashboardSectionCard
          title="✍️ Écrire aujourd’hui"
          description="Exprime un ressenti, une pensée ou un souvenir."
        >
          <Button title="Commencer une entrée" onPress={goToWritePage} />
        </DashboardSectionCard>

        {/* LIBRARY */}
        <DashboardSectionCard
          title="📚 Mes contenus"
          description="Retrouve tous tes textes et fichiers au même endroit."
        >
          <Button title="Voir tous mes contenus" onPress={goToLibraryPage} />
        </DashboardSectionCard>

        {/* ADD DOCUMENT */}
        <DashboardSectionCard
          title="📎 Ajouter un document"
          description="Photo, audio ou fichier à partager dans ton espace."
        >
          <Button title="Choisir un fichier" onPress={pickFile} />
        </DashboardSectionCard>

        {/* PRIVATE MODE */}
        <DashboardSectionCard
          title="🔒 Mode privé"
          description="Visible uniquement par moi"
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
              Activer / désactiver
            </Text>

            <Switch
              value={isPrivateModeEnabled}
              onValueChange={handlePrivateModeToggle}
            />
          </View>
        </DashboardSectionCard>
      </View>
    </Screen>
  );
}
