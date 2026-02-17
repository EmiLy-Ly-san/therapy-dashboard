import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Screen, Card, Button } from '../../../components/ui';
import { colors } from '../../../constants';
import { supabase } from '../../../lib/supabase';

import PhotoPreview from '../../../components/item/PhotoPreview';
import ItemNotesSection from '../../../components/item/ItemNotesSection';
import PageHeader from '../../../components/common/PageHeader';

import { useItemShare } from '../../../hooks/useItemShare';

export default function ItemDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [item, setItem] = useState<any>(null);
  const [textValue, setTextValue] = useState('');
  const [titleValue, setTitleValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Ajout : toggle Partager avec le thérapeute
  const {
    therapistId,
    isShared,
    isTogglingShare,
    errorMessage: shareErrorMessage,
    setShareEnabled,
  } = useItemShare(id ? String(id) : null);

  function handleBackPress() {
    // Retour stable vers la library
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

    if (data?.type === 'text') {
      setTextValue(data.text_content || '');
      setTitleValue(data.title || '');
    } else {
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

    handleBackPress();
  }

  async function deleteItem() {
    if (!id || !item) return;

    try {
      setIsDeleting(true);
      setErrorMessage('');

      // 1) supprimer les notes liées à cet item
      const { error: notesError } = await supabase
        .from('item_notes')
        .delete()
        .eq('item_id', id);

      if (notesError) throw notesError;

      // 2) supprimer le fichier storage s'il existe
      const bucket = item.storage_bucket ? String(item.storage_bucket) : '';
      const path = item.storage_path ? String(item.storage_path) : '';

      if (bucket && path) {
        const { error: storageError } = await supabase.storage
          .from(bucket)
          .remove([path]);

        if (storageError) throw storageError;
      }

      // 3) supprimer l'item
      // (avec ON DELETE CASCADE côté DB, item_shares sera supprimé automatiquement)
      const { error: itemError } = await supabase
        .from('items')
        .delete()
        .eq('id', id);

      if (itemError) throw itemError;

      handleBackPress();
    } catch (e: any) {
      console.log('DELETE ITEM ERROR', e);
      setErrorMessage(e?.message ?? JSON.stringify(e));
    } finally {
      setIsDeleting(false);
    }
  }

  useEffect(() => {
    loadItem();
  }, [id]);

  if (isLoading) {
    return (
      <Screen centered>
        <ActivityIndicator />
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
      <PageHeader
        title="Détail"
        iconName="file-text"
        onBack={handleBackPress}
      />

      {/* Erreurs item */}
      {errorMessage.length > 0 ? (
        <Text style={{ marginTop: 10, color: colors.danger }}>
          {errorMessage}
        </Text>
      ) : null}

      {/* Erreurs partage */}
      {shareErrorMessage.length > 0 ? (
        <Text style={{ marginTop: 10, color: colors.danger }}>
          {shareErrorMessage}
        </Text>
      ) : null}

      {/* Ajout : Toggle partage (dans le détail seulement) */}
      <View
        style={{
          marginTop: 14,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderColor: colors.border,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '800', color: colors.textPrimary }}>
            Partager avec mon thérapeute
          </Text>
          <Text
            style={{ marginTop: 4, fontSize: 12, color: colors.textSecondary }}
          >
            {therapistId
              ? 'Votre thérapeute pourra voir cet item.'
              : "Aucun thérapeute n'est lié pour le moment."}
          </Text>
        </View>

        <Switch
          value={isShared}
          onValueChange={(v) => {
            // feedback immédiat : le switch bouge
            // puis on applique en base
            setShareEnabled(v);
          }}
          disabled={isTogglingShare || !id}
        />
      </View>

      {/* PHOTO */}
      {isPhoto ? (
        <PhotoPreview bucket={item.storage_bucket} path={item.storage_path} />
      ) : null}

      {/* TEXTE */}
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
              paddingTop: 10,
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

      {/* NOTES */}
      <ItemNotesSection itemId={String(id)} />

      {/* SUPPRIMER ITEM : bouton léger rouge (outline) */}
      <View style={{ marginTop: 18 }}>
        <Pressable
          onPress={deleteItem}
          disabled={isDeleting}
          style={{
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.danger,
            backgroundColor: 'transparent',
            opacity: isDeleting ? 0.6 : 1,
          }}
        >
          <Text
            style={{ color: colors.danger, fontWeight: '700', fontSize: 14 }}
          >
            {isDeleting ? 'Suppression...' : 'Supprimer ce contenu'}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
