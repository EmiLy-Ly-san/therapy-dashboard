import { useEffect, useState } from 'react';
import { Text, View, Switch, Platform, Alert } from 'react-native';

import LogoutButton from '../../components/auth/LogoutButton';
import { uploadPatientFile } from '../../lib/uploadPatientFile';

import { Screen, Button, Input } from '../../components/ui';
import { colors } from '../../constants';

import DashboardSectionCard from '../../components/dashboard/DashboardSectionCard';
import usePatientDashboardActions from '../../hooks/usePatientDashboardActions';
import { supabase } from '../../lib/supabase';

export default function PatientDashboardPage() {
  const isWeb = Platform.OS === 'web';
  const { goToWritePage, goToLibraryPage } = usePatientDashboardActions();

  const [isPrivateModeEnabled, setIsPrivateModeEnabled] = useState(false);
  const [displayName, setDisplayName] = useState<string>('');

  async function loadDisplayName() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;

    const { data } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', userData.user.id)
      .maybeSingle();

    if (data?.display_name) {
      const raw = String(data.display_name).trim();
      if (raw.length > 0) {
        // On affiche juste le prénom
        setDisplayName(raw.split(' ')[0]);
      }
    }
  }

  useEffect(() => {
    loadDisplayName();
  }, []);

  function handleSearchChange(textValue: string) {
    console.log('Recherche:', textValue);
  }

  function handlePrivateModeToggle(nextValue: boolean) {
    setIsPrivateModeEnabled(nextValue);
  }

  async function handlePickFile() {
    try {
      const res = await uploadPatientFile();
      if (!res.ok && res.reason === 'canceled') return;
      Alert.alert('OK', 'Fichier ajouté ✅');
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? JSON.stringify(e));
    }
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
            {displayName ? `Bonjour, ${displayName}` : 'Bonjour'}
          </Text>
        </View>

        <Input
          placeholder="Rechercher (notes, fichiers…)"
          onChangeText={handleSearchChange}
        />

        <DashboardSectionCard
          title="✍️ Écrire aujourd’hui"
          description="Exprime un ressenti, une pensée ou un souvenir."
        >
          <Button title="Commencer une entrée" onPress={goToWritePage} />
        </DashboardSectionCard>

        <DashboardSectionCard
          title="📎 Ajouter un document"
          description="Photo, audio ou fichier à partager dans ton espace."
        >
          <Button title="Choisir un fichier" onPress={handlePickFile} />
        </DashboardSectionCard>

        <DashboardSectionCard
          title="📚 Mes contenus"
          description="Retrouve tous tes textes et fichiers au même endroit."
        >
          <Button title="Voir tous mes contenus" onPress={goToLibraryPage} />
        </DashboardSectionCard>

        <DashboardSectionCard title="👤 Compte" description="Gérer ma session">
          <LogoutButton redirectTo="/" />
        </DashboardSectionCard>
      </View>
    </Screen>
  );
}
