/**
 * Therapist - Patient Library (contenus partagés uniquement)
 *
 * Page UI :
 * - Affiche le header
 * - Liste les items partagés d’un patient
 * - Permet d’ouvrir le détail / fichier
 */

import { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Screen, Button } from '../../../../components/ui';
import { colors } from '../../../../constants';
import { supabase } from '../../../../lib/supabase';

import LibraryItemCard from '../../../../components/library/LibraryItemCard';

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

  async function buildThumbs(list: any[]) {
    const next: Record<string, string> = {};

    for (const it of list) {
      const typeValue = getTypeValue(it);
      if (typeValue !== 'photo') continue;

      const bucket = it.storage_bucket ? String(it.storage_bucket) : '';
      const path = it.storage_path ? String(it.storage_path) : '';
      if (!bucket || !path) continue;

      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(path, 60 * 10);

        if (!error && data?.signedUrl) next[String(it.id)] = data.signedUrl;
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

      // On récupère uniquement les items partagés (via item_shares) pour ce patient
      // NB: la RLS limite deja au therapist connecté
      const { data, error } = await supabase
        .from('items')
        .select(
          'id, type, title, text_content, created_at, storage_bucket, storage_path, mime_type',
        )
        .eq('patient_id', pid)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const list = data ?? [];

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
          Contenus partagés
        </Text>

        <Button title="Retour" variant="ghost" onPress={handleBackPress} />
      </View>

      <Text style={{ marginTop: 8, color: colors.textSecondary }}>
        Contenus partagés par le patient.
      </Text>

      {errorMessage.length > 0 ? (
        <Text style={{ marginTop: 12, color: colors.danger }}>
          {errorMessage}
        </Text>
      ) : null}

      {isLoading ? (
        <View style={{ marginTop: 16, alignItems: 'center', gap: 10 }}>
          <ActivityIndicator />
          <Text style={{ color: colors.textSecondary }}>Chargement…</Text>
        </View>
      ) : (
        <View style={{ marginTop: 12, gap: 12 }}>
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
                  openFileItem(item);
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
    </Screen>
  );
}
