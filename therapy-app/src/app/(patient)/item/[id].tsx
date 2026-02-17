import {
  Text,
  View,
  TextInput,
  Pressable,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Screen, Card, Button } from '../../../components/ui';
import { colors } from '../../../constants';

import PhotoPreview from '../../../components/item/PhotoPreview';
import ItemNotesSection from '../../../components/item/ItemNotesSection';
import PageHeader from '../../../components/common/PageHeader';

import { useItemShare } from '../../../hooks/useItemShare';
import { usePatientItem } from '../../../hooks/usePatientItem';

export default function ItemDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const itemId = id ? String(id) : null;

  // Data item (load/save/delete)
  const {
    item,
    isText,
    isPhoto,
    titleValue,
    setTitleValue,
    textValue,
    setTextValue,
    isLoading,
    isSaving,
    isDeleting,
    errorMessage,
    saveText,
    deleteItem,
  } = usePatientItem(itemId);

  // Toggle partage vers thérapeute
  const {
    therapistId,
    isShared,
    isTogglingShare,
    errorMessage: shareErrorMessage,
    setShareEnabled,
  } = useItemShare(itemId);

  function handleBackPress() {
    // Retour stable vers la library
    router.replace('/(patient)/library' as any);
  }

  async function handleSavePress() {
    const ok = await saveText();
    if (ok) handleBackPress();
  }

  async function handleDeletePress() {
    const ok = await deleteItem();
    if (ok) handleBackPress();
  }

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
          onValueChange={(v) => setShareEnabled(v)}
          disabled={isTogglingShare || !itemId}
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
      <ItemNotesSection itemId={String(itemId)} />

      {/* SUPPRIMER ITEM : bouton léger rouge (outline) */}
      <View style={{ marginTop: 18 }}>
        <Pressable
          onPress={handleDeletePress}
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
