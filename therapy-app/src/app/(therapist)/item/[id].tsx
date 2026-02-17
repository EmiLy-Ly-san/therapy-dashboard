import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Screen, Card, Button } from '../../../components/ui';
import { colors } from '../../../constants';
import { supabase } from '../../../lib/supabase';

import PhotoPreview from '../../../components/item/PhotoPreview';
import PageHeader from '../../../components/common/PageHeader';

export default function TherapistItemDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isWeb = Platform.OS === 'web';

  const [item, setItem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  function handleBackPress() {
    router.back();
  }

  async function loadItem() {
    setErrorMessage('');

    if (!id) {
      setErrorMessage("ID manquant (impossible d'ouvrir l'item).");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // RLS : le therapist ne peut lire que les items partagés
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', String(id))
      .single();

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    setItem(data);
    setIsLoading(false);
  }

  useEffect(() => {
    loadItem();
  }, [id]);

  if (isLoading) {
    return (
      <Screen centered={false} style={{ justifyContent: 'flex-start' }}>
        <View style={{ marginTop: 40, alignItems: 'center' }}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  if (!item) {
    return (
      <Screen
        centered={false}
        maxWidth={720}
        style={{ justifyContent: 'flex-start' }}
      >
        <Text style={{ color: colors.danger }}>
          {errorMessage.length > 0 ? errorMessage : 'Item introuvable.'}
        </Text>

        <View style={{ marginTop: 16 }}>
          <Button title="Retour" variant="ghost" onPress={handleBackPress} />
        </View>
      </Screen>
    );
  }

  const typeValue = String(item.type || '');
  const isText = typeValue === 'text';
  const isPhoto = typeValue === 'photo';

  return (
    <Screen centered={false} style={{ justifyContent: 'flex-start' }}>
      <View
        style={{
          width: '100%',
          maxWidth: isWeb ? 720 : '100%',
          alignSelf: 'center',
          gap: 24,
        }}
      >
        <PageHeader
          title="Détail"
          iconName="file-text"
          onBack={handleBackPress}
        />

        {errorMessage.length > 0 ? (
          <Text style={{ color: colors.danger }}>{errorMessage}</Text>
        ) : null}

        {/* Badge partagé */}
        <View
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 999,
            alignSelf: 'flex-start',
            backgroundColor: '#EEF2FF',
          }}
        >
          <Text
            style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}
          >
            Contenu partagé par le patient
          </Text>
        </View>

        {/* PHOTO */}
        {isPhoto ? (
          <PhotoPreview bucket={item.storage_bucket} path={item.storage_path} />
        ) : null}

        {/* TEXTE (lecture seule) */}
        {isText ? (
          <Card>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '800',
                color: colors.textPrimary,
              }}
            >
              {item.title || 'Entrée'}
            </Text>

            <Text
              style={{
                marginTop: 12,
                fontSize: 16,
                lineHeight: 24,
                color: colors.textPrimary,
              }}
            >
              {item.text_content || ''}
            </Text>
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}
