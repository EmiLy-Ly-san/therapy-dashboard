/**
 * PageHeader.tsx
 * --------------
 * Petit composant réutilisable :
 * - Icône à gauche (Feather)
 * - Titre
 * - Bouton retour à droite
 * - Sous-titre optionnel
 */

import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Button } from '../ui';
import { colors } from '../../constants';

type Props = {
  title: string;
  iconName: keyof typeof Feather.glyphMap;
  onBack: () => void;
  subtitle?: string;
};

export default function PageHeader({
  title,
  iconName,
  onBack,
  subtitle,
}: Props) {
  return (
    <View style={{ gap: 6 }}>
      {/* Header row */}
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
            <Feather name={iconName} size={18} color={colors.primary} />
          </View>

          <Text
            style={{
              fontSize: 18,
              fontWeight: '800',
              color: colors.textPrimary,
            }}
          >
            {title}
          </Text>
        </View>

        <Button title="Retour" variant="ghost" onPress={onBack} />
      </View>

      {subtitle ? (
        <Text style={{ color: colors.textSecondary }}>{subtitle}</Text>
      ) : null}
    </View>
  );
}
