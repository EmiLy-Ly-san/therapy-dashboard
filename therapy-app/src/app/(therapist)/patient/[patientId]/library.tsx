/**
 * library.tsx (therapist → patient)
 * ---------------------------------
 * - Liste des contenus partagés par un patient donné
 * - Le thérapeute doit sélectionner un patient avant d’accéder à la liste
 * - Grâce à la RLS : uniquement ceux partagés par le patient
 */

import { useEffect, useMemo, useState } from 'react';
import {
  Text,
  View,
  Pressable,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Screen, Button } from '../../../../components/ui';
import { colors } from '../../../../constants';
import { supabase } from '../../../../lib/supabase';

import LibraryItemCard from '../../../../components/library/LibraryItemCard';
import { getSignedUrl } from '../../../../lib/storageUrls';

type FilterType = 'all' | 'text' | 'files';

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const MIN_LOADER_MS = 500;

export default function TherapistPatientLibraryPage() {
  const router = useRouter();
  const { patientId } = useLocalSearchParams();

  const [filterType, setFilterType] = useState<FilterType>('all');

  const [patientName, setPatientName] = useState<string>('Patient');

  const [items, setItems] = useState<any[]>([]);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

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

  async function buildThumbs(list: any[]) {
    const next: Record<string, string> = {};

    for (const it of list) {
      const typeValue = String(it.type || '');
      if (typeValue !== 'photo') continue;

      const bucket = it.storage_bucket ? String(it.storage_bucket) : '';
      const path = it.storage_path ? String(it.storage_path) : '';
      if (!bucket || !path) continue;

      try {
        const url = await getSignedUrl(bucket, path, 60 * 10);
        if (url) next[String(it.id)] = url;
      } catch (e) {
        console.log('thumb error', e);
      }
    }

    setThumbUrls(next);
  }

  async function loadPatientName(pid: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', pid)
        .maybeSingle();

      if (error) return;

      const raw = data?.display_name;
      if (typeof raw === 'string' && raw.trim().length > 0) {
        setPatientName(raw.trim());
      } else {
        setPatientName('Patient');
      }
    } catch (e) {
      console.log('LOAD PATIENT NAME ERROR', e);
    }
  }

  /**
   * Charge les items partagés d'un patient pour le therapist connecté
   * reason = initial (page load) ou refresh (bouton).
   */
  async function loadItems(reason: 'initial' | 'refresh' = 'refresh') {
    setErrorMessage('');

    const pid = patientId ? String(patientId) : '';
    if (!pid) {
      setErrorMessage('Patient ID manquant.');
      setIsLoading(false);
      setIsRefreshing(false);
      setShowLoader(false);
      return;
    }

    if (reason === 'initial') setIsLoading(true);
    else setIsRefreshing(true);

    setShowLoader(true);
    const startTime = Date.now();

    try {
      // 1) user connecté (therapist)
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData?.user) {
        throw new Error("Tu n'es pas connecté(e).");
      }

      const therapistId = userData.user.id;

      // 2) nom patient (non bloquant mais on le charge ici au même endroit)
      await loadPatientName(pid);

      /**
       * 3) on récupère les items via item_shares
       * - therapist_id = current therapist
       * - revoked_at is null
       * - item.patient_id = patient sélectionné
       *
       * On utilise une jointure : item_shares -> items
       * avec un alias "item:items(...)"
       */
      const { data, error } = await supabase
        .from('item_shares')
        .select(
          `
          id,
          item_id,
          therapist_id,
          shared_at,
          revoked_at,
          item:items (
            id,
            patient_id,
            type,
            title,
            text_content,
            created_at,
            storage_bucket,
            storage_path,
            mime_type
          )
        `,
        )
        .eq('therapist_id', therapistId)
        .is('revoked_at', null)
        .eq('item.patient_id', pid)
        .order('shared_at', { ascending: false });

      if (error) throw error;

      const list = (data ?? []).map((row: any) => row.item).filter(Boolean);

      setItems(list);
      await buildThumbs(list);

      // Loader min 500ms
      const elapsed = Date.now() - startTime;
      await wait(Math.max(0, MIN_LOADER_MS - elapsed));
    } catch (e: any) {
      console.log('LOAD SHARED ITEMS ERROR', e);

      const elapsed = Date.now() - startTime;
      await wait(Math.max(0, MIN_LOADER_MS - elapsed));

      setErrorMessage(e?.message ?? JSON.stringify(e));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setShowLoader(false);
    }
  }

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      const typeValue = String(item.type || '');
      if (filterType === 'all') return true;
      if (filterType === 'text') return typeValue === 'text';
      return typeValue !== 'text';
    });
  }, [items, filterType]);

  const isBusy = isLoading || isRefreshing;
  const shouldShowLoader = showLoader && isBusy;

  useEffect(() => {
    loadItems('initial');
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
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text
            style={{
              fontSize: 26,
              fontWeight: '900',
              color: colors.textPrimary,
            }}
          >
            Contenus partagés
          </Text>

          <Text style={{ marginTop: 6, color: colors.textSecondary }}>
            {patientName}
          </Text>
        </View>

        <Button title="Retour" variant="ghost" onPress={handleBackPress} />
      </View>

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
        {!shouldShowLoader && visibleItems.length === 0 ? (
          <Text style={{ color: colors.textSecondary }}>
            Aucun contenu partagé pour le moment.
          </Text>
        ) : null}

        {!shouldShowLoader &&
          visibleItems.map((item) => {
            const typeValue = String(item.type || '');

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
              />
            );
          })}
      </View>
    </Screen>
  );
}
