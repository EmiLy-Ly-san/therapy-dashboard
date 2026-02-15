/**
 * PhotoPreview.tsx
 * ----------------
 * Affiche l'image si l'item est de type "photo".
 * Récupère une signed URL depuis Supabase Storage.
 */

import { useEffect, useState } from 'react';
import { View, Image, Text } from 'react-native';
import { supabase } from '../../lib/supabase';
import { colors } from '../../constants';

type Props = {
  bucket?: string | null;
  path?: string | null;
};

export default function PhotoPreview({ bucket, path }: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadImage() {
      if (!bucket || !path) return;

      // 1) Génère une URL temporaire
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 60 * 10);

      if (error) {
        console.log('image error', error);
        return;
      }

      setImageUrl(data?.signedUrl ?? null);
    }

    loadImage();
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
