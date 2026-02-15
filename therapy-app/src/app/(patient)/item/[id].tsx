import { useEffect, useState } from 'react';
import { View, Text, TextInput } from 'react-native';
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

  // Retour stable vers la library (même si on arrive direct par URL)
  function handleBackPress() {
    router.replace('/(patient)/library' as any);
  }

  async function loadItem() {
    setErrorMessage('');

    if (!id) {
      setErrorMessage("ID manquant (impossible d'ouvrir l'item).");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

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

    // Si c'est un texte : on prépare les champs d'édition
    if (data?.type === 'text') {
      setTextValue(data.text_content || '');
      setTitleValue(data.title || '');
    } else {
      // Sinon, on vide au cas où (évite de garder un ancien état)
      setTextValue('');
      setTitleValue('');
    }

    setIsLoading(false);
  }

  async function handleSavePress() {
    if (!id) {
      setErrorMessage("ID manquant (impossible d'enregistrer).");
      return;
    }

    if (!item || item.type !== 'text') {
      setErrorMessage("Cet item n'est pas un texte.");
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

    // Après sauvegarde, on retourne à la library (plus clair pour l'utilisateur)
    handleBackPress();
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

  if (!item) {
    return (
      <Screen centered maxWidth={720}>
        <Text style={{ color: colors.danger }}>
          {errorMessage.length > 0 ? errorMessage : 'Item introuvable.'}
        </Text>

        <View style={{ marginTop: 16 }}>
          <Button title="Retour" variant="ghost" onPress={handleBackPress} />
        </View>
      </Screen>
    );
  }

  const typeValue = String(item.type || '');
  const isText = typeValue === 'text';
  const isPhoto = typeValue === 'photo';

  return (
    <Screen centered maxWidth={720}>
      {/* HEADER + bouton retour */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Text
          style={{
            fontSize: 26,
            fontWeight: '800',
            color: colors.textPrimary,
          }}
        >
          Détail
        </Text>

        <Button title="Retour" variant="ghost" onPress={handleBackPress} />
      </View>

      {errorMessage.length > 0 ? (
        <Text style={{ marginTop: 10, color: colors.danger }}>
          {errorMessage}
        </Text>
      ) : null}

      {/* PHOTO */}
      {isPhoto ? (
        <PhotoPreview bucket={item.storage_bucket} path={item.storage_path} />
      ) : null}

      {/* TEXTE (édition) */}
      {isText ? (
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

          <View style={{ marginTop: 12 }}>
            <Button
              title={isSaving ? 'Enregistrement...' : 'Enregistrer'}
              onPress={handleSavePress}
              isLoading={isSaving}
            />
          </View>
        </Card>
      ) : null}

      {/* NOTES (pour tous les types) */}
      <ItemNotesSection itemId={String(id)} />
    </Screen>
  );
}
