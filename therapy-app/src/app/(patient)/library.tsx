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
import {
  Text,
  View,
  Pressable,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, Button } from '../../components/ui';
import { colors } from '../../constants';
import { supabase } from '../../lib/supabase';

import LibraryItemCard from '../../components/library/LibraryItemCard';
import { usePatientItems, FilterType } from '../../hooks/usePatientItems';

export default function PatientLibraryPage() {
  const router = useRouter();

  const [filterType, setFilterType] = useState<FilterType>('all');

  const {
    visibleItems,
    thumbUrls,
    errorMessage,
    isBusy,
    shouldShowLoader,
    loadItems,

    // Ajout : status Partagé/Privé dans la liste
    sharedByItemId,
  } = usePatientItems(filterType);

  function handleBackPress() {
    router.back();
  }

  function handleFilterPress(nextFilter: FilterType) {
    setFilterType(nextFilter);
  }

  async function openFileItem(item: any) {
    const bucket = item.storage_bucket ? String(item.storage_bucket) : '';
    const path = item.storage_path ? String(item.storage_path) : '';
    if (!bucket || !path) return;

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 10);

    if (error) return;
    if (data?.signedUrl) await Linking.openURL(data.signedUrl);
  }

  // chargement initial
  useEffect(() => {
    loadItems('initial');
  }, []);

  return (
    <Screen centered maxWidth={720}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text
          style={{ fontSize: 26, fontWeight: '900', color: colors.textPrimary }}
        >
          Mes contenus
        </Text>

        <Button title="Retour" variant="ghost" onPress={handleBackPress} />
      </View>

      <Text style={{ marginTop: 8, color: colors.textSecondary }}>
        Tous tes textes et fichiers, au même endroit.
      </Text>

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
      {shouldShowLoader ? (
        <View style={{ marginTop: 16, alignItems: 'center', gap: 10 }}>
          <ActivityIndicator />
          <Text style={{ color: colors.textSecondary }}>Chargement…</Text>
        </View>
      ) : null}

      {/* Liste */}
      <View style={{ marginTop: 12, gap: 12 }}>
        {!shouldShowLoader &&
          visibleItems.map((item) => {
            const typeValue = String(item.type || '');
            const itemId = String(item.id);

            const onPress = () => {
              // texte + photo => page détail
              if (typeValue === 'text' || typeValue === 'photo') {
                router.push(`/(patient)/item/${item.id}` as any);
              } else {
                openFileItem(item);
              }
            };

            return (
              <LibraryItemCard
                key={itemId}
                item={item}
                thumbUrl={thumbUrls[itemId]}
                onPress={onPress}
                // Ajout : status discret dans la liste
                isShared={sharedByItemId[itemId] === true}
              />
            );
          })}
      </View>
    </Screen>
  );
}
