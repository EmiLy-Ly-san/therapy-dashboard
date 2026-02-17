import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { Screen, Card, Button } from '../../../components/ui';
import { colors } from '../../../constants';

import PhotoPreview from '../../../components/item/PhotoPreview';
import { useTherapistItem } from '../../../hooks/useTherapistItem';

export default function TherapistItemDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isWeb = Platform.OS === 'web';

  const itemId = id ? String(id) : null;

  const { item, isLoading, errorMessage, isText, isPhoto } =
    useTherapistItem(itemId);

  function handleBackPress() {
    router.back();
  }

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
        {/* HEADER */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#EEF2FF',
              }}
            >
              <Feather name="file-text" size={18} color={colors.primary} />
            </View>

            <Text
              style={{
                fontSize: 18,
                fontWeight: '800',
                color: colors.textPrimary,
              }}
            >
              Détail
            </Text>
          </View>

          <Button title="Retour" variant="ghost" onPress={handleBackPress} />
        </View>

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
