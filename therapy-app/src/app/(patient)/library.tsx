/**
 * library.tsx
 * -----------
 * Page UI (simple) :
 * - Affiche le header
 * - Affiche les filtres
 * - Affiche le bouton refresh
 * - Affiche la liste
 *
 * Toute la logique data est dans usePatientItems()
 * et l'affichage 1 item est dans LibraryItemCard.
 */

import { useEffect, useState } from 'react';
import { Text, View, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { Screen, Button } from '../../components/ui';
import { colors } from '../../constants';

import LibraryItemCard from '../../components/library/LibraryItemCard';
import { usePatientItems, FilterType } from '../../hooks/usePatientItems';
import { openStorageItem } from '../../lib/openStorageItem';
import PageHeader from '../../components/common/PageHeader';

export default function PatientLibraryPage() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [filterType, setFilterType] = useState<FilterType>('all');

  const {
    visibleItems,
    thumbUrls,
    errorMessage,
    isBusy,
    shouldShowLoader,
    loadItems,
    sharedByItemId,
  } = usePatientItems(filterType);

  const [isUploadingFromDashboard, setIsUploadingFromDashboard] =
    useState(false);

  const shouldShowAnyLoader = isUploadingFromDashboard || shouldShowLoader;

  function handleBackPress() {
    router.back();
  }

  function handleFilterPress(nextFilter: FilterType) {
    setFilterType(nextFilter);
  }

  useEffect(() => {
    loadItems('initial');
  }, []);

  useEffect(() => {
    if (String(params.uploading ?? '') === '1') {
      setIsUploadingFromDashboard(true);
      loadItems('refresh');
      router.setParams({ uploading: undefined } as any);
    }
  }, [params.uploading]);

  useEffect(() => {
    if (!isBusy && isUploadingFromDashboard) {
      setIsUploadingFromDashboard(false);
    }
  }, [isBusy]);

  return (
    <Screen maxWidth={720}>
      <PageHeader
        title="Mes contenus"
        iconName="book-open"
        onBack={handleBackPress}
        subtitle="Tous tes textes et fichiers, au même endroit."
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
        {(['all', 'text', 'files'] as FilterType[]).map((ft) => (
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

      {/* Loader */}
      {shouldShowAnyLoader ? (
        <View style={{ marginTop: 24, alignItems: 'center', gap: 10 }}>
          <ActivityIndicator />
          {isUploadingFromDashboard ? (
            <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>
              Upload en cours…
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* Liste */}
      <View style={{ marginTop: 12, gap: 12 }}>
        {!shouldShowAnyLoader &&
          visibleItems.map((item) => {
            const typeValue = String(item.type || '');

            const onPress = () => {
              if (typeValue === 'text' || typeValue === 'photo') {
                router.push(`/(patient)/item/${item.id}` as any);
              } else {
                openStorageItem(item);
              }
            };

            return (
              <LibraryItemCard
                key={String(item.id)}
                item={item}
                thumbUrl={thumbUrls[String(item.id)]}
                onPress={onPress}
                visibilityLabel={
                  sharedByItemId[String(item.id)] === true ? 'Partagé' : 'Privé'
                }
              />
            );
          })}
      </View>
    </Screen>
  );
}
