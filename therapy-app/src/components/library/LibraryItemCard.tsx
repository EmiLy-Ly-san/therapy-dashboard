/**
 * Un composant UI pour afficher 1 item dans la liste.
 *
 * Objectif :
 * - Afficher titre, date, type
 * - Afficher un extrait si texte
 * - Afficher une miniature si photo (si on l'a)
 * - Gérer le clic (fourni par le parent)
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

  // Ajout : status discret
  isShared?: boolean;
};

export default function LibraryItemCard({
  item,
  thumbUrl,
  onPress,
  isShared = false,
}: Props) {
  const typeValue = String(item.type || '');
  const titleValue = item.title ? String(item.title) : null;
  const textValue = item.text_content ? String(item.text_content) : '';
  const dateValue = item.created_at ? String(item.created_at) : '';

  return (
    <Card>
      <Pressable onPress={onPress}>
        {/* Ligne info + status discret */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
            {getTypeLabel(typeValue)} • {dateValue ? formatDate(dateValue) : ''}
          </Text>

          {/* Status discret (petite police) */}
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: 'transparent',
            }}
          >
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>
              {isShared ? 'Partagé' : 'Privé'}
            </Text>
          </View>
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

        {/* TEXTE : extrait */}
        {typeValue === 'text' ? (
          <Text style={{ marginTop: 6, color: colors.textSecondary }}>
            {textValue.length > 140 ? `${textValue.slice(0, 140)}…` : textValue}
          </Text>
        ) : null}

        {/* PHOTO : miniature */}
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
