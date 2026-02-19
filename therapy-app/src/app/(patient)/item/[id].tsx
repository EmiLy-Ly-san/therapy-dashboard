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

import { useEffect, useMemo, useState } from 'react';
import { getSignedUrl } from '../../../lib/storageUrls';

// ✅ expo-video (SDK 54)
import { VideoView, useVideoPlayer } from 'expo-video';

function getExt(path?: string | null) {
  if (!path) return '';
  const clean = String(path).split('?')[0];
  const parts = clean.split('.');
  return parts.length > 1 ? String(parts.pop() || '').toLowerCase() : '';
}

function inferTypeFromMimeOrExt(mime?: string | null, path?: string | null) {
  const m = String(mime || '').toLowerCase();

  // ✅ priorité au mime
  if (m.startsWith('video/')) return 'video';
  if (m.startsWith('audio/')) return 'audio';
  if (m.startsWith('image/')) return 'photo';

  // ✅ fallback extension
  const ext = getExt(path);
  if (['mp4', 'mov', 'm4v', 'webm'].includes(ext)) return 'video';
  if (['mp3', 'm4a', 'aac', 'wav', 'ogg'].includes(ext)) return 'audio';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext))
    return 'photo';

  return 'file';
}

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

  // ✅ Signed URL pour media
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isMediaLoading, setIsMediaLoading] = useState(false);

  // ✅ Type fiable : on préfère TOUJOURS mime/ext à item.type
  const effectiveType = useMemo(() => {
    if (!item) return null;

    const inferred = inferTypeFromMimeOrExt(item.mime_type, item.storage_path);
    if (inferred !== 'file') return inferred;

    // fallback sur la DB si on ne sait pas
    const dbType = String(item.type || '');
    if (
      dbType === 'text' ||
      dbType === 'photo' ||
      dbType === 'audio' ||
      dbType === 'video'
    ) {
      return dbType;
    }

    return 'file';
  }, [item]);

  // Reset media quand on change d'item
  useEffect(() => {
    setMediaUrl(null);
    setIsMediaLoading(false);
  }, [itemId]);

  // charge signed url si audio/vidéo
  useEffect(() => {
    let canceled = false;

    async function loadMedia() {
      if (!item) return;
      if (effectiveType !== 'audio' && effectiveType !== 'video') return;

      const bucket = item.storage_bucket;
      const path = item.storage_path;

      if (!bucket || !path) {
        if (!canceled) setMediaUrl(null);
        return;
      }

      try {
        if (!canceled) setIsMediaLoading(true);
        const signed = await getSignedUrl(bucket, path, 60 * 10);
        if (!canceled) setMediaUrl(signed || null);
      } catch (e) {
        console.log('media url error', e);
        if (!canceled) setMediaUrl(null);
      } finally {
        if (!canceled) setIsMediaLoading(false);
      }
    }

    loadMedia();

    return () => {
      canceled = true;
    };
  }, [item, effectiveType]);

  // Player expo-video (hook toujours appelé)
  const player = useVideoPlayer(mediaUrl || '', (p) => {
    p.loop = false;
  });

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

  // ✅ Empêche d'afficher un "ancien item" pendant le chargement du nouvel ID
  const currentId = itemId ? String(itemId) : null;
  const loadedId = item?.id != null ? String(item.id) : null;

  if (currentId && loadedId && loadedId !== currentId) {
    return (
      <Screen centered>
        <ActivityIndicator />
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

      {/* VIDEO */}
      {effectiveType === 'video' ? (
        <Card style={{ marginTop: 16 }}>
          {isMediaLoading ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <ActivityIndicator />
              <Text
                style={{
                  marginTop: 10,
                  color: colors.textSecondary,
                  fontWeight: '600',
                }}
              >
                Chargement vidéo…
              </Text>
            </View>
          ) : mediaUrl ? (
            <VideoView
              player={player}
              nativeControls
              style={{ width: '100%', height: 240, borderRadius: 12 }}
            />
          ) : (
            <Text style={{ color: colors.danger }}>
              Impossible de charger la vidéo.
            </Text>
          )}
        </Card>
      ) : null}

      {/* AUDIO (simple : contrôles natifs, sans image) */}
      {effectiveType === 'audio' ? (
        <Card style={{ marginTop: 16 }}>
          {isMediaLoading ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <ActivityIndicator />
              <Text
                style={{
                  marginTop: 10,
                  color: colors.textSecondary,
                  fontWeight: '600',
                }}
              >
                Chargement audio…
              </Text>
            </View>
          ) : mediaUrl ? (
            <VideoView
              player={player}
              nativeControls
              style={{ width: '100%', height: 80, borderRadius: 12 }}
            />
          ) : (
            <Text style={{ color: colors.danger }}>
              Impossible de charger l’audio.
            </Text>
          )}
        </Card>
      ) : null}

      {/* PHOTO */}
      {effectiveType === 'photo' ? (
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
