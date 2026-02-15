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

  function handleBackPress() {
    console.log('Retour depuis modification');
    router.replace('/(patient)/library' as any);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  async function loadItem() {
    if (!id) {
      setErrorMessage("ID manquant (impossible d'ouvrir l'entrée).");
      setIsLoading(false);
      return;
    }

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

  async function handleSavePress() {
    if (!id) {
      setErrorMessage("ID manquant (impossible d'enregistrer).");
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    const cleanTitle = titleValue.trim();
    const cleanText = textValue.trim();

    if (cleanText.length === 0) {
      setIsSaving(false);
      setErrorMessage('Le texte ne peut pas être vide.');
      return;
    }

    const { error } = await supabase
      .from('items')
      .update({
        title: cleanTitle.length > 0 ? cleanTitle : null,
        text_content: cleanText,
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
  }, [loadItem]);

  if (isLoading) {
    return (
      <Screen centered>
        <Text>Chargement...</Text>
      </Screen>
    );
  }

  return (
    <Screen centered maxWidth={720}>
      {/* HEADER avec bouton retour */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Text
          style={{ fontSize: 26, fontWeight: '800', color: colors.textPrimary }}
        >
          Modifier l’entrée
        </Text>

        <Button title="Retour" variant="ghost" onPress={handleBackPress} />
      </View>

      <Card style={{ marginTop: 16 }}>
        <TextInput
          placeholder="Titre (optionnel)"
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

      {errorMessage.length > 0 ? (
        <Text style={{ marginTop: 10, color: colors.danger }}>
          {errorMessage}
        </Text>
      ) : null}

      <View style={{ marginTop: 16 }}>
        <Button
          title={isSaving ? 'Enregistrement...' : 'Enregistrer'}
          onPress={handleSavePress}
          isLoading={isSaving}
        />
      </View>
    </Screen>
  );
}
