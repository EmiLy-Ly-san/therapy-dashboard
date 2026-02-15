import { useEffect, useState } from 'react';
import {
  Text,
  View,
  Pressable,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, Card, Button } from '../../components/ui';
import { colors } from '../../constants';
import { supabase } from '../../lib/supabase';

type FilterType = 'all' | 'text' | 'files';

function formatDate(isoDate: string) {
  return isoDate.slice(0, 10);
}

function getTypeLabel(typeValue: string) {
  if (typeValue === 'text') return 'Texte';
  if (typeValue === 'audio') return 'Audio';
  if (typeValue === 'video') return 'Vidéo';
  if (typeValue === 'photo') return 'Photo';
  return 'Fichier';
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

const MIN_LOADER_MS = 500;

export default function PatientLibraryPage() {
  const router = useRouter();

  const [filterType, setFilterType] = useState<FilterType>('all');
  const [items, setItems] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  // 1) premier chargement de la page
  const [isLoading, setIsLoading] = useState(true);

  // 2) refresh manuel (bouton)
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 3) loader "visible" au moins MIN_LOADER_MS
  const [showLoader, setShowLoader] = useState(true);

  function handleBackPress() {
    router.back();
  }

  function handleFilterPress(nextFilter: FilterType) {
    setFilterType(nextFilter);
  }

  async function openFileItem(item: any) {
    setErrorMessage('');

    const bucket = item.storage_bucket ? String(item.storage_bucket) : '';
    const path = item.storage_path ? String(item.storage_path) : '';

    if (!bucket || !path) {
      setErrorMessage("Ce fichier n'a pas de chemin storage.");
      return;
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 10); // 10 minutes

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    const url = data?.signedUrl;
    if (!url) {
      setErrorMessage("Impossible de générer l'URL.");
      return;
    }

    await Linking.openURL(url);
  }

  async function loadItems(reason: 'initial' | 'refresh' = 'refresh') {
    setErrorMessage('');

    if (reason === 'initial') {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    setShowLoader(true);
    const startTime = Date.now();

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      const elapsed = Date.now() - startTime;
      await wait(Math.max(0, MIN_LOADER_MS - elapsed));

      setIsLoading(false);
      setIsRefreshing(false);
      setShowLoader(false);
      setErrorMessage("Tu n'es pas connecté(e).");
      return;
    }

    const userId = userData.user.id;

    const { data, error } = await supabase
      .from('items')
      .select(
        'id, type, title, text_content, created_at, storage_bucket, storage_path, mime_type',
      )
      .eq('patient_id', userId)
      .order('created_at', { ascending: false });

    const elapsed = Date.now() - startTime;
    await wait(Math.max(0, MIN_LOADER_MS - elapsed));

    setIsLoading(false);
    setIsRefreshing(false);
    setShowLoader(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setItems(data || []);
  }

  useEffect(() => {
    loadItems('initial');
  }, []);

  const visibleItems = items.filter((item) => {
    const typeValue = String(item.type || '');
    if (filterType === 'all') return true;
    if (filterType === 'text') return typeValue === 'text';
    return typeValue !== 'text';
  });

  const isBusy = isLoading || isRefreshing;
  const shouldShowLoader = showLoader && isBusy;

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
        <Pressable
          onPress={() => handleFilterPress('all')}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor:
              filterType === 'all' ? '#EEF2FF' : colors.cardBackground,
          }}
        >
          <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
            Tout
          </Text>
        </Pressable>

        <Pressable
          onPress={() => handleFilterPress('text')}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor:
              filterType === 'text' ? '#EEF2FF' : colors.cardBackground,
          }}
        >
          <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
            Textes
          </Text>
        </Pressable>

        <Pressable
          onPress={() => handleFilterPress('files')}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor:
              filterType === 'files' ? '#EEF2FF' : colors.cardBackground,
          }}
        >
          <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
            Fichiers
          </Text>
        </Pressable>
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

      {/* Loader (un seul) */}
      {shouldShowLoader ? (
        <View style={{ marginTop: 16, alignItems: 'center', gap: 10 }}>
          <ActivityIndicator />
          <Text style={{ color: colors.textSecondary }}>Chargement…</Text>
        </View>
      ) : null}

      {/* Liste */}
      <View style={{ marginTop: 12, gap: 12 }}>
        {!shouldShowLoader && visibleItems.length === 0 ? (
          <Card>
            <Text style={{ fontWeight: '800', color: colors.textPrimary }}>
              Rien pour le moment
            </Text>
            <Text style={{ marginTop: 6, color: colors.textSecondary }}>
              Tes textes et fichiers apparaîtront ici dès que tu en ajoutes.
            </Text>
          </Card>
        ) : null}

        {!shouldShowLoader &&
          visibleItems.map((item) => {
            const typeValue = String(item.type || '');
            const titleValue = item.title ? String(item.title) : null;
            const textValue = item.text_content
              ? String(item.text_content)
              : '';
            const dateValue = item.created_at ? String(item.created_at) : '';

            return (
              <Card key={String(item.id)}>
                <Pressable
                  onPress={() => {
                    if (typeValue === 'text') {
                      router.push(`/(patient)/item/${item.id}` as any);
                    } else {
                      openFileItem(item);
                    }
                  }}
                >
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                    {getTypeLabel(typeValue)} •{' '}
                    {dateValue ? formatDate(dateValue) : ''}
                  </Text>

                  <Text
                    style={{
                      marginTop: 6,
                      fontWeight: '800',
                      color: colors.textPrimary,
                    }}
                  >
                    {titleValue ||
                      (typeValue === 'text' ? 'Entrée' : 'Document')}
                  </Text>

                  {typeValue === 'text' ? (
                    <Text style={{ marginTop: 6, color: colors.textSecondary }}>
                      {textValue.length > 140
                        ? `${textValue.slice(0, 140)}…`
                        : textValue}
                    </Text>
                  ) : (
                    <Text style={{ marginTop: 6, color: colors.textSecondary }}>
                      Appuie pour ouvrir le fichier
                    </Text>
                  )}
                </Pressable>
              </Card>
            );
          })}
      </View>
    </Screen>
  );
}
