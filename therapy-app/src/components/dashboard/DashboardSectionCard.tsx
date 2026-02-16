import { ReactNode } from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Card } from '../ui';
import { colors } from '../../constants';

type Props = {
  title: string;
  description?: string;
  children?: ReactNode;

  // Ajout : icône (Feather) comme tes notes
  iconName?: keyof typeof Feather.glyphMap;
};

export default function DashboardSectionCard({
  title,
  description,
  children,
  iconName,
}: Props) {
  return (
    <Card>
      <View style={{ gap: 10 }}>
        {/* Header : icône + titre */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {iconName ? (
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
          ) : null}

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: colors.textPrimary,
              }}
            >
              {title}
            </Text>

            {description ? (
              <Text
                style={{
                  marginTop: 4,
                  fontSize: 10,
                  color: colors.textSecondary,
                }}
              >
                {description}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Contenu */}
        {children ? <View style={{ marginTop: 2 }}>{children}</View> : null}
      </View>
    </Card>
  );
}
