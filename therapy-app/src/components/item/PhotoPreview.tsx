/**
 * PhotoPreview.tsx
 * ----------------
 * Affiche l'image si l'item est de type "photo".
 * Récupère une signed URL depuis Supabase Storage.
 */

import { useEffect, useState } from 'react';
import { View, Image, Text } from 'react-native';
import { colors } from '../../constants';
import { getSignedUrl } from '../../lib/storageUrls';

type Props = {
  bucket?: string | null;
  path?: string | null;
};

export default function PhotoPreview({ bucket, path }: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;

    async function loadImage() {
      if (!bucket || !path) return;

      try {
        // 1) Génère une URL temporaire
        const signedUrl = await getSignedUrl(bucket, path, 60 * 10);
        if (!canceled) setImageUrl(signedUrl || null);
      } catch (error) {
        console.log('image error', error);
        if (!canceled) setImageUrl(null);
      }
    }

    loadImage();

    return () => {
      canceled = true;
    };
  }, [bucket, path]);

  if (!imageUrl) {
    return (
      <Text style={{ color: colors.textSecondary }}>Chargement image...</Text>
    );
  }

  return (
    <View style={{ marginTop: 16 }}>
      <Image
        source={{ uri: imageUrl }}
        style={{ width: '100%', height: 240, borderRadius: 12 }}
        resizeMode="cover"
      />
    </View>
  );
}
