import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top', 'left', 'right']}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        // petit offset pour éviter que ça "colle" au top sur iOS
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            padding: 24,
            ...(centered ? { justifyContent: 'center' } : {}),
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === 'ios' ? 'interactive' : 'on-drag'
          }
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
