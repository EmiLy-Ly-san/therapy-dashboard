import { useEffect, useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, Card, Button } from '../../components/ui';
import { colors } from '../../constants';
import { supabase } from '../../lib/supabase';

type FilterType = 'all' | 'text' | 'files';

function formatDate(isoDate: string) {
  // isoDate: "2026-02-15T..."
  return isoDate.slice(0, 10);
}

function getTypeLabel(typeValue: string) {
  if (typeValue === 'text') return 'Texte';
  if (typeValue === 'audio') return 'Audio';
  if (typeValue === 'video') return 'Vidéo';
  if (typeValue === 'photo') return 'Photo';
  return 'Fichier';
}

export default function PatientLibraryPage() {
  const router = useRouter();

  const [filterType, setFilterType] = useState<FilterType>('all');
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  function handleBackPress() {
    router.back();
  }

  function handleFilterPress(nextFilter: FilterType) {
    setFilterType(nextFilter);
  }

  async function loadItems() {
    setErrorMessage('');
    setIsLoading(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      setIsLoading(false);
      setErrorMessage("Tu n'es pas connecté(e).");
      return;
    }

    const userId = userData.user.id;

    const { data, error } = await supabase
      .from('items')
      .select('id, type, title, text_content, created_at')
      .eq('patient_id', userId)
      .order('created_at', { ascending: false });

    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setItems(data || []);
  }

  useEffect(() => {
    loadItems();
  }, []);

  const visibleItems = items.filter((item) => {
    const typeValue = String(item.type || '');
    if (filterType === 'all') return true;
    if (filterType === 'text') return typeValue === 'text';
    return typeValue !== 'text';
  });

  return (
    <Screen centered maxWidth={720}>
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

      {/* Actions */}
      <View style={{ marginTop: 14 }}>
        <Button
          title={isLoading ? 'Chargement...' : 'Rafraîchir'}
          onPress={loadItems}
          variant="ghost"
        />
      </View>

      {errorMessage.length > 0 ? (
        <Text style={{ marginTop: 12, color: colors.danger }}>
          {errorMessage}
        </Text>
      ) : null}

      {/* Liste */}
      <View style={{ marginTop: 12, gap: 12 }}>
        {visibleItems.length === 0 && !isLoading ? (
          <Card>
            <Text style={{ fontWeight: '800', color: colors.textPrimary }}>
              Rien pour le moment
            </Text>
            <Text style={{ marginTop: 6, color: colors.textSecondary }}>
              Tes textes et fichiers apparaîtront ici dès que tu en ajoutes.
            </Text>
          </Card>
        ) : null}

        {visibleItems.map((item) => {
          const typeValue = String(item.type || '');
          const titleValue = item.title ? String(item.title) : null;
          const textValue = item.text_content ? String(item.text_content) : '';
          const dateValue = item.created_at ? String(item.created_at) : '';

          return (
            <Card key={String(item.id)}>
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
                {titleValue || (typeValue === 'text' ? 'Entrée' : 'Document')}
              </Text>

              {typeValue === 'text' ? (
                <Text style={{ marginTop: 6, color: colors.textSecondary }}>
                  {textValue.length > 140
                    ? `${textValue.slice(0, 140)}…`
                    : textValue}
                </Text>
              ) : (
                <Text style={{ marginTop: 6, color: colors.textSecondary }}>
                  (Aperçu fichier à brancher ensuite)
                </Text>
              )}
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}
