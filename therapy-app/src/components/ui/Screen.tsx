import { ReactNode } from 'react';
import { Platform, ScrollView, View, ViewStyle } from 'react-native';

import { colors } from '../../constants';

type ScreenProps = {
  children: ReactNode;
  style?: ViewStyle;
  centered?: boolean;
  maxWidth?: number;
};

export default function Screen({
  children,
  style,
  centered = false,
  maxWidth = 520,
}: ScreenProps) {
  const isWeb = Platform.OS === 'web';

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        backgroundColor: colors.background,
        padding: 24,
        ...(centered ? { justifyContent: 'center' } : {}),
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={{
          width: '100%',
          maxWidth: isWeb ? maxWidth : '100%',
          alignSelf: 'center',
          ...(style || {}),
        }}
      >
        {children}
      </View>
    </ScrollView>
  );
}
