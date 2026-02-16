/**
 * Un composant UI pour afficher 1 item dans la liste.
 *
 * Objectif :
 * - Afficher titre, date, type
 * - Afficher un extrait si texte
 * - Afficher une miniature si photo (si on l'a)
 * - Gérer le clic (fourni par le parent)
 * - Afficher un label discret (Privé / Partagé)
 */

import { View, Text, Pressable, Image } from 'react-native';
import { Card } from '../ui';
import { colors } from '../../constants';

function formatDate(isoDate: string) {
  return isoDate.slice(0, 10);
}

function getTypeLabel(typeValue: string) {
  if (typeValue === 'text') return 'Texte';
  if (typeValue === 'audio') return 'Audio';
  if (typeValue === 'video') return 'Vidéo';
  if (typeValue === 'photo') return 'Photo';
  if (typeValue === 'file') return 'Fichier';
  return 'Fichier';
}

type Props = {
  item: any;
  thumbUrl?: string;
  onPress: () => void;
  visibilityLabel?: string | null;
  hidePrivateLabel?: boolean;
};

export default function LibraryItemCard({
  item,
  thumbUrl,
  onPress,
  visibilityLabel = null,
  hidePrivateLabel = false,
}: Props) {
  const typeValue = String(item.type || '');
  const titleValue = item.title ? String(item.title) : null;
  const textValue = item.text_content ? String(item.text_content) : '';
  const dateValue = item.created_at ? String(item.created_at) : '';

  const lowerLabel = visibilityLabel?.toLowerCase();

  const shouldShowVisibility =
    !!visibilityLabel && !(hidePrivateLabel && lowerLabel === 'privé');

  // 🎨 Couleurs dynamiques selon statut
  let badgeBackground = colors.cardBackground;
  let badgeBorder = colors.border;
  let badgeText = colors.textSecondary;

  if (lowerLabel === 'partagé') {
    badgeBackground = '#E6F6EE'; // vert très léger
    badgeBorder = '#A7E3C7';
    badgeText = '#15803D'; // vert soutenu
  }

  if (lowerLabel === 'privé') {
    badgeBackground = '#FFF7E6'; // jaune doux
    badgeBorder = '#F5D7A1';
    badgeText = '#B45309'; // orangé/or
  }

  return (
    <Card>
      <Pressable onPress={onPress}>
        {/* Ligne meta */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
            {getTypeLabel(typeValue)} • {dateValue ? formatDate(dateValue) : ''}
          </Text>

          {shouldShowVisibility ? (
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: badgeBorder,
                backgroundColor: badgeBackground,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '800',
                  color: badgeText,
                }}
              >
                {visibilityLabel}
              </Text>
            </View>
          ) : null}
        </View>

        <Text
          style={{
            marginTop: 6,
            fontWeight: '800',
            color: colors.textPrimary,
          }}
        >
          {titleValue || (typeValue === 'text' ? 'Entrée' : 'Document')}
        </Text>

        {/* TEXTE */}
        {typeValue === 'text' ? (
          <Text style={{ marginTop: 6, color: colors.textSecondary }}>
            {textValue.length > 140 ? `${textValue.slice(0, 140)}…` : textValue}
          </Text>
        ) : null}

        {/* PHOTO */}
        {typeValue === 'photo' ? (
          <View style={{ marginTop: 10 }}>
            {thumbUrl ? (
              <Image
                source={{ uri: thumbUrl }}
                style={{ width: '100%', height: 160, borderRadius: 12 }}
                resizeMode="cover"
              />
            ) : (
              <Text style={{ marginTop: 6, color: colors.textSecondary }}>
                (Miniature en cours…)
              </Text>
            )}
          </View>
        ) : null}

        {/* AUTRES FICHIERS */}
        {typeValue !== 'text' && typeValue !== 'photo' ? (
          <Text style={{ marginTop: 6, color: colors.textSecondary }}>
            Appuie pour ouvrir le fichier
          </Text>
        ) : null}
      </Pressable>
    </Card>
  );
}
