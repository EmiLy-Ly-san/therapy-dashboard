import { Pressable, Text, ActivityIndicator } from 'react-native';
import { colors, fontSizes } from '../../constants';

type ButtonVariant = 'primary' | 'danger' | 'ghost';

type ButtonProps = {
  title: string;
  onPress?: () => void;
  isLoading?: boolean;
  variant?: ButtonVariant;
};

export default function Button({
  title,
  onPress,
  isLoading = false,
  variant = 'primary',
}: ButtonProps) {
  const backgroundColor =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.danger
        : 'transparent';

  const textColor = variant === 'ghost' ? colors.primary : 'white';

  const borderWidth = variant === 'ghost' ? 1 : 0;
  const borderColor = variant === 'ghost' ? colors.border : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      disabled={isLoading}
      style={{
        backgroundColor,
        borderWidth,
        borderColor,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        opacity: isLoading ? 0.7 : 1,
      }}
    >
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <Text
          style={{
            color: textColor,
            fontWeight: '700',
            fontSize: fontSizes.body,
          }}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}
