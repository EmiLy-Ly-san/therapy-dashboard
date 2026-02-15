import { View, ViewProps, Platform } from 'react-native';
import { colors, spacing } from '../../constants';

type ScreenProps = ViewProps & {
  centered?: boolean; // si true : centre + maxWidth sur web
  maxWidth?: number; // largeur max sur desktop
};

export default function Screen({
  centered = false,
  maxWidth = 520,
  style,
  children,
  ...rest
}: ScreenProps) {
  const isWeb = Platform.OS === 'web';

  if (!centered) {
    return (
      <View
        {...rest}
        style={[
          {
            flex: 1,
            backgroundColor: colors.background,
            padding: spacing.screenPadding,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  // ✅ mode centered : on centre le contenu et on limite la largeur sur desktop
  return (
    <View
      {...rest}
      style={[
        {
          flex: 1,
          backgroundColor: colors.background,
          padding: spacing.screenPadding,
          alignItems: 'center',
        },
        style,
      ]}
    >
      <View style={{ width: '100%', maxWidth: isWeb ? maxWidth : '100%' }}>
        {children}
      </View>
    </View>
  );
}
