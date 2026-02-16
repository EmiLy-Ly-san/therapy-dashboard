import { useEffect, useState } from 'react';
import { Text, View, Platform, Alert, Image } from 'react-native';

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
        <View style={{ gap: 16 }}>
          <Image
            source={require('../../assets/images/therapy-dashboard-little.svg')}
            style={{ width: 180, height: 42 }}
            resizeMode="contain"
          />

          <Text
            style={{
              fontSize: 18,
              fontWeight: '500',
              color: colors.textPrimary,
            }}
          >
            {displayName ? `Bonjour, ${displayName}` : 'Bonjour'}
          </Text>
        </View>

        <Input
          placeholder="Rechercher (notes, fichiers…)"
          style={{
            fontSize: 12,
          }}
          onChangeText={handleSearchChange}
        />

        <DashboardSectionCard
          iconName="edit-3"
          title="Écrire aujourd’hui"
          description="Exprime un ressenti, une pensée ou un souvenir."
        >
          <Button title="Commencer une entrée" onPress={goToWritePage} />
        </DashboardSectionCard>

        <DashboardSectionCard
          iconName="paperclip"
          title="Ajouter un document"
          description="Photo, audio ou fichier à partager dans ton espace."
        >
          <Button title="Choisir un fichier" onPress={handlePickFile} />
        </DashboardSectionCard>

        <DashboardSectionCard
          iconName="book-open"
          title="Mes contenus"
          description="Retrouve tous tes textes et fichiers au même endroit."
        >
          <Button title="Voir tous mes contenus" onPress={goToLibraryPage} />
        </DashboardSectionCard>

        <DashboardSectionCard
          iconName="user"
          title="Compte"
          description="Gérer ma session"
        >
          <LogoutButton redirectTo="/" />
        </DashboardSectionCard>
      </View>
    </Screen>
  );
}
