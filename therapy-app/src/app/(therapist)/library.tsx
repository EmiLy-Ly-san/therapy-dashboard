/**
 * library.tsx (therapist)
 * -----------------------
 * - Liste des contenus visibles par le thérapeute
 * - Grâce à la RLS : uniquement ceux partagés par les patients
 *
 * Refacto :
 * - La query passe par item_shares dans useTherapistItems()
 */

import { useEffect, useState } from 'react';
import { Text, View, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, Button } from '../../components/ui';
import { colors } from '../../constants';

import LibraryItemCard from '../../components/library/LibraryItemCard';
import {
  useTherapistItems,
  TherapistFilterType,
} from '../../hooks/useTherapistItems';
import PageHeader from '../../components/common/PageHeader';

export default function TherapistLibraryPage() {
  const router = useRouter();

  const [filterType, setFilterType] = useState<TherapistFilterType>('all');

  const {
    visibleItems,
    thumbUrls,
    errorMessage,
    isBusy,
    shouldShowLoader,
    loadItems,
  } = useTherapistItems(filterType);

  function handleBackPress() {
    router.back();
  }

  function handleFilterPress(nextFilter: TherapistFilterType) {
    setFilterType(nextFilter);
  }

  useEffect(() => {
    loadItems('initial');
  }, []);

  return (
    <Screen centered maxWidth={720}>
      <PageHeader
        title="Contenus partagés"
        iconName="book-open"
        onBack={handleBackPress}
        subtitle="Uniquement les contenus partagés par les patients."
      />

      {/* Filtres */}
      <View
        style={{
          marginTop: 16,
          flexDirection: 'row',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        {(['all', 'text', 'files'] as TherapistFilterType[]).map((ft) => (
          <Pressable
            key={ft}
            onPress={() => handleFilterPress(ft)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor:
                filterType === ft ? '#EEF2FF' : colors.cardBackground,
            }}
          >
            <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
              {ft === 'all' ? 'Tout' : ft === 'text' ? 'Textes' : 'Fichiers'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Action */}
      <View style={{ marginTop: 14 }}>
        <Button
          title="Rafraîchir"
          onPress={() => loadItems('refresh')}
          variant="ghost"
          disabled={isBusy}
        />
      </View>

      {errorMessage.length > 0 ? (
        <Text style={{ marginTop: 12, color: colors.danger }}>
          {errorMessage}
        </Text>
      ) : null}

      {shouldShowLoader ? (
        <View style={{ marginTop: 16, alignItems: 'center', gap: 10 }}>
          <ActivityIndicator />
        </View>
      ) : null}

      <View style={{ marginTop: 12, gap: 12 }}>
        {!shouldShowLoader &&
          visibleItems.map((item) => {
            const typeValue = String(item.type || '');

            const onPress = () => {
              // ✅ Unifie l'expérience : tous les types ouvrent la page détail
              // (audio/vidéo seront lus dans la page détail avec expo-video)
              router.push(`/(therapist)/item/${item.id}` as any);
            };

            return (
              <LibraryItemCard
                key={String(item.id)}
                item={item}
                thumbUrl={thumbUrls[String(item.id)]}
                onPress={onPress}
                hidePrivateLabel
              />
            );
          })}
      </View>
    </Screen>
  );
}
