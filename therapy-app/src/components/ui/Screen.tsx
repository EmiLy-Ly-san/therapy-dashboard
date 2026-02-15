import { View, ViewProps } from 'react-native';
import { colors, spacing } from '../../constants';

export default function Screen(props: ViewProps) {
  return (
    <View
      {...props}
      style={[
        {
          flex: 1,
          backgroundColor: colors.background,
          padding: spacing.screenPadding,
        },
        props.style,
      ]}
    />
  );
}
