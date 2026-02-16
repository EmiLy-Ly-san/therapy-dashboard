import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Screen, Card, Button } from '../../../components/ui';
import { colors } from '../../../constants';
import { supabase } from '../../../lib/supabase';

import PhotoPreview from '../../../components/item/PhotoPreview';

export default function TherapistItemDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

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
      <Screen centered>
        <Text>Chargement...</Text>
      </Screen>
    );
  }

  if (!item) {
    return (
      <Screen centered maxWidth={720}>
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
    <Screen centered maxWidth={720}>
      {/* HEADER */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Text
          style={{ fontSize: 26, fontWeight: '800', color: colors.textPrimary }}
        >
          Détail
        </Text>

        <Button title="Retour" variant="ghost" onPress={handleBackPress} />
      </View>

      {errorMessage.length > 0 ? (
        <Text style={{ marginTop: 10, color: colors.danger }}>
          {errorMessage}
        </Text>
      ) : null}

      {/* Badge partagé */}
      <View style={{ marginTop: 12 }}>
        <Text style={{ fontSize: 12, color: colors.textSecondary }}>
          Contenu partagé par le patient
        </Text>
      </View>

      {/* PHOTO */}
      {isPhoto ? (
        <PhotoPreview bucket={item.storage_bucket} path={item.storage_path} />
      ) : null}

      {/* TEXTE (lecture seule) */}
      {isText ? (
        <Card style={{ marginTop: 16 }}>
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
              color: colors.textPrimary,
            }}
          >
            {item.text_content || ''}
          </Text>
        </Card>
      ) : null}
    </Screen>
  );
}
