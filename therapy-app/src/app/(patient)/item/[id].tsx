import { useEffect, useState } from 'react';
import { Text, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Screen, Card, Button } from '../../../components/ui';
import { colors } from '../../../constants';
import { supabase } from '../../../lib/supabase';

import PhotoPreview from '../../../components/item/PhotoPreview';
import ItemNotesSection from '../../../components/item/ItemNotesSection';

export default function ItemDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [item, setItem] = useState<any>(null);
  const [textValue, setTextValue] = useState('');
  const [titleValue, setTitleValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function loadItem() {
    if (!id) return;

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    setItem(data);

    if (data.type === 'text') {
      setTextValue(data.text_content || '');
      setTitleValue(data.title || '');
    }

    setIsLoading(false);
  }

  async function handleSavePress() {
    if (!id || !item || item.type !== 'text') return;

    setIsSaving(true);

    await supabase
      .from('items')
      .update({
        title: titleValue.trim() || null,
        text_content: textValue.trim(),
      })
      .eq('id', id);

    setIsSaving(false);
    router.back();
  }

  useEffect(() => {
    loadItem();
  }, []);

  if (isLoading || !item) {
    return (
      <Screen centered>
        <Text>Chargement...</Text>
      </Screen>
    );
  }

  const isText = item.type === 'text';
  const isPhoto = item.type === 'photo';

  return (
    <Screen centered maxWidth={720}>
      <Text
        style={{
          fontSize: 26,
          fontWeight: '800',
          color: colors.textPrimary,
        }}
      >
        Détail
      </Text>

      {/* PHOTO */}
      {isPhoto && (
        <PhotoPreview bucket={item.storage_bucket} path={item.storage_path} />
      )}

      {/* TEXTE */}
      {isText && (
        <Card style={{ marginTop: 16 }}>
          <TextInput
            placeholder="Titre"
            value={titleValue}
            onChangeText={setTitleValue}
            style={{ marginBottom: 12 }}
          />

          <TextInput
            multiline
            value={textValue}
            onChangeText={setTextValue}
            style={{ minHeight: 200 }}
          />

          <Button
            title={isSaving ? 'Enregistrement...' : 'Enregistrer'}
            onPress={handleSavePress}
            isLoading={isSaving}
          />
        </Card>
      )}

      {/* NOTES (pour tous les types) */}
      <ItemNotesSection itemId={String(id)} />
    </Screen>
  );
}
