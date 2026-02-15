import { TextInput, TextInputProps } from 'react-native';
import { colors, fontSizes } from '../../constants';

export default function Input(props: TextInputProps) {
  return (
    <TextInput
      {...props}
      placeholderTextColor="#9CA3AF"
      style={[
        {
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: 'white',
          padding: 12,
          borderRadius: 14,
          color: colors.textPrimary,
          fontSize: fontSizes.body,
        },
        props.style,
      ]}
    />
  );
}
