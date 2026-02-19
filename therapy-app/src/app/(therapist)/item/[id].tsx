import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { Screen, Card, Button } from '../../../components/ui';
import { colors } from '../../../constants';

import PhotoPreview from '../../../components/item/PhotoPreview';
import { useTherapistItem } from '../../../hooks/useTherapistItem';

// Ajout vidéo/audio
import { useEffect, useMemo, useState } from 'react';
import { VideoView, useVideoPlayer } from 'expo-video';
import { getSignedUrl } from '../../../lib/storageUrls';

function getExt(path?: string | null) {
  if (!path) return '';
  const clean = String(path).split('?')[0];
  const parts = clean.split('.');
  return parts.length > 1 ? String(parts.pop() || '').toLowerCase() : '';
}

function inferTypeFromMimeOrExt(mime?: string | null, path?: string | null) {
  const m = String(mime || '').toLowerCase();

  if (m.startsWith('video/')) return 'video';
  if (m.startsWith('audio/')) return 'audio';
  if (m.startsWith('image/')) return 'photo';

  const ext = getExt(path);
  if (['mp4', 'mov', 'm4v', 'webm'].includes(ext)) return 'video';
  if (['mp3', 'm4a', 'aac', 'wav', 'ogg'].includes(ext)) return 'audio';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext))
    return 'photo';

  return 'file';
}

export default function TherapistItemDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isWeb = Platform.OS === 'web';

  const itemId = id ? String(id) : null;

  const { item, isLoading, errorMessage, isText, isPhoto } =
    useTherapistItem(itemId);

  // Signed URL pour media
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isMediaLoading, setIsMediaLoading] = useState(false);

  // Type fiable (mime/ext d'abord)
  const effectiveType = useMemo(() => {
    if (!item) return null;

    const inferred = inferTypeFromMimeOrExt(item.mime_type, item.storage_path);
    if (inferred !== 'file') return inferred;

    // fallback : si hook te donne un type stable, on le garde
    if (isText) return 'text';
    if (isPhoto) return 'photo';

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
  }, [item, isText, isPhoto]);

  // Reset media à chaque changement d'id
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
        console.log('therapist media url error', e);
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
    router.back();
  }

  if (isLoading) {
    return (
      <Screen centered={false} style={{ justifyContent: 'flex-start' }}>
        <View style={{ marginTop: 40, alignItems: 'center' }}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  if (!item) {
    return (
      <Screen
        centered={false}
        maxWidth={720}
        style={{ justifyContent: 'flex-start' }}
      >
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
    <Screen centered={false} style={{ justifyContent: 'flex-start' }}>
      <View
        style={{
          width: '100%',
          maxWidth: isWeb ? 720 : '100%',
          alignSelf: 'center',
          gap: 24,
        }}
      >
        {/* HEADER */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#EEF2FF',
              }}
            >
              <Feather name="file-text" size={18} color={colors.primary} />
            </View>

            <Text
              style={{
                fontSize: 18,
                fontWeight: '800',
                color: colors.textPrimary,
              }}
            >
              Détail
            </Text>
          </View>

          <Button title="Retour" variant="ghost" onPress={handleBackPress} />
        </View>

        {errorMessage.length > 0 ? (
          <Text style={{ color: colors.danger }}>{errorMessage}</Text>
        ) : null}

        {/* Badge partagé */}
        <View
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 999,
            alignSelf: 'flex-start',
            backgroundColor: '#EEF2FF',
          }}
        >
          <Text
            style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}
          >
            Contenu partagé par le patient
          </Text>
        </View>

        {/* VIDEO */}
        {effectiveType === 'video' ? (
          <Card>
            {isMediaLoading ? (
              <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                <ActivityIndicator />
                <Text
                  style={{
                    marginTop: 10,
                    fontSize: 12,
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

        {/* AUDIO */}
        {effectiveType === 'audio' ? (
          <Card>
            {isMediaLoading ? (
              <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                <ActivityIndicator />
                <Text
                  style={{
                    marginTop: 10,
                    fontSize: 12,
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

        {/* TEXTE (lecture seule) */}
        {effectiveType === 'text' ? (
          <Card>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '800',
                color: colors.textPrimary,
              }}
            >
              {item.title || 'Entrée'}
            </Text>

            <Text
              style={{
                marginTop: 12,
                fontSize: 16,
                lineHeight: 24,
                color: colors.textPrimary,
              }}
            >
              {item.text_content || ''}
            </Text>
          </Card>
        ) : null}

        {/* AUTRE TYPE */}
        {effectiveType === 'file' ? (
          <Card>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
              Ce type de contenu n’est pas encore supporté dans l’interface.
            </Text>
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}
