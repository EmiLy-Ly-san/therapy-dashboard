import { View, ViewProps } from 'react-native';
import { colors } from '../../constants';

export default function Card(props: ViewProps) {
  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: colors.cardBackground,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 14,
        },
        props.style,
      ]}
    />
  );
}
