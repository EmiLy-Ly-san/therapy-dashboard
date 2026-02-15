import { useEffect, useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Screen, Card, Button } from '../../../components/ui';
import { colors } from '../../../constants';
import { supabase } from '../../../lib/supabase';

export default function ItemDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

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

    setTextValue(data.text_content || '');
    setTitleValue(data.title || '');
    setIsLoading(false);
  }

  async function handleSave() {
    if (!id) return;

    setIsSaving(true);
    setErrorMessage('');

    const { error } = await supabase
      .from('items')
      .update({
        title: titleValue,
        text_content: textValue,
      })
      .eq('id', id);

    setIsSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.back();
  }

  useEffect(() => {
    loadItem();
  }, []);

  if (isLoading) {
    return (
      <Screen centered>
        <Text>Chargement...</Text>
      </Screen>
    );
  }

  return (
    <Screen centered maxWidth={720}>
      <Text
        style={{ fontSize: 26, fontWeight: '800', color: colors.textPrimary }}
      >
        Modifier l’entrée
      </Text>

      <Card style={{ marginTop: 16 }}>
        <TextInput
          placeholder="Titre"
          value={titleValue}
          onChangeText={setTitleValue}
          style={{
            fontSize: 16,
            marginBottom: 12,
            color: colors.textPrimary,
          }}
        />

        <TextInput
          multiline
          value={textValue}
          onChangeText={setTextValue}
          style={{
            minHeight: 200,
            fontSize: 16,
            color: colors.textPrimary,
            textAlignVertical: 'top',
          }}
        />
      </Card>

      {errorMessage.length > 0 && (
        <Text style={{ marginTop: 10, color: colors.danger }}>
          {errorMessage}
        </Text>
      )}

      <View style={{ marginTop: 16 }}>
        <Button
          title={
            isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'
          }
          onPress={handleSave}
          isLoading={isSaving}
        />
      </View>
    </Screen>
  );
}
