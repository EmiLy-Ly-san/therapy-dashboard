import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Card } from '../ui';
import { colors } from '../../constants';

type DashboardSectionCardProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export default function DashboardSectionCard({
  title,
  description,
  children,
}: DashboardSectionCardProps) {
  return (
    <Card>
      <View style={{ gap: 12 }}>
        <Text
          style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary }}
        >
          {title}
        </Text>

        <Text style={{ color: colors.textSecondary }}>{description}</Text>

        {children}
      </View>
    </Card>
  );
}
