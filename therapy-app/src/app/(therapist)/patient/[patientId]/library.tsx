/**
 * Therapist - Patient Library (contenus partagés uniquement)
 *
 * Page UI :
 * - Affiche le header
 * - Liste les items partagés d’un patient
 * - Permet d’ouvrir le détail / fichier
 */

import { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Screen } from '../../../../components/ui';
import { colors } from '../../../../constants';
import { supabase } from '../../../../lib/supabase';

import LibraryItemCard from '../../../../components/library/LibraryItemCard';
import { openStorageItem } from '../../../../lib/openStorageItem';
import { getSignedUrl } from '../../../../lib/storageUrls';
import PageHeader from '../../../../components/common/PageHeader';

function getTypeValue(item: any) {
  return String(item?.type || '');
}

export default function TherapistPatientLibraryPage() {
  const router = useRouter();
  const { patientId } = useLocalSearchParams();

  const [items, setItems] = useState<any[]>([]);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  function handleBackPress() {
    router.back();
  }

  async function buildThumbs(list: any[]) {
    const next: Record<string, string> = {};

    for (const it of list) {
      const typeValue = getTypeValue(it);
      if (typeValue !== 'photo') continue;

      const bucket = it?.storage_bucket ? String(it.storage_bucket) : '';
      const path = it?.storage_path ? String(it.storage_path) : '';
      if (!bucket || !path) continue;

      try {
        const signedUrl = await getSignedUrl(bucket, path);
        if (signedUrl) next[String(it.id)] = signedUrl;
      } catch (e) {
        console.log('thumb error', e);
      }
    }

    setThumbUrls(next);
  }

  async function loadSharedItems() {
    setErrorMessage('');
    setIsLoading(true);

    try {
      if (!patientId) {
        setErrorMessage('Patient ID manquant.');
        setIsLoading(false);
        return;
      }

      const pid = String(patientId);

      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData?.user) {
        setErrorMessage("Tu n'es pas connecté(e).");
        setIsLoading(false);
        return;
      }

      const therapistId = userData.user.id;

      const { data, error } = await supabase
        .from('item_shares')
        .select(
          `
          item:items (
            id, type, title, text_content, created_at, storage_bucket, storage_path, mime_type, patient_id
          )
        `,
        )
        .eq('therapist_id', therapistId)
        .is('revoked_at', null)
        .eq('item.patient_id', pid)
        .order('shared_at', { ascending: false });

      if (error) throw error;

      const list = (data ?? []).map((r: any) => r.item).filter(Boolean);

      setItems(list);
      await buildThumbs(list);
    } catch (e: any) {
      console.log('LOAD THERAPIST PATIENT LIBRARY ERROR', e);
      setErrorMessage(e?.message ?? JSON.stringify(e));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSharedItems();
  }, [patientId]);

  return (
    <Screen maxWidth={720}>
      <View style={{ width: '100%', alignSelf: 'center', gap: 24 }}>
        <PageHeader
          title="Contenus partagés"
          iconName="share-2"
          onBack={handleBackPress}
          subtitle="Contenus partagés par le patient."
        />

        {errorMessage.length > 0 ? (
          <Text style={{ marginTop: 12, color: colors.danger }}>
            {errorMessage}
          </Text>
        ) : null}

        {isLoading ? (
          <View style={{ marginTop: 8, alignItems: 'center' }}>
            <ActivityIndicator />
          </View>
        ) : (
          <View style={{ marginTop: 0, gap: 12 }}>
            {items.length === 0 ? (
              <Text style={{ color: colors.textSecondary }}>
                Aucun contenu partagé pour le moment.
              </Text>
            ) : (
              items.map((item) => {
                const typeValue = getTypeValue(item);

                const onPress = () => {
                  if (typeValue === 'text' || typeValue === 'photo') {
                    router.push(`/(therapist)/item/${item.id}` as any);
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
                    hidePrivateLabel
                  />
                );
              })
            )}
          </View>
        )}
      </View>
    </Screen>
  );
}
