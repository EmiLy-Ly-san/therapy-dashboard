import { Pressable, Text, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, gradients } from '../../constants/theme';

type ButtonProps = {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  variant?: 'primary' | 'ghost';
};

export default function Button({
  title,
  onPress,
  isLoading = false,
  variant = 'primary',
}: ButtonProps) {
  const isPrimary = variant === 'primary';

  if (!isPrimary) {
    return (
      <Pressable
        onPress={onPress}
        style={{
          paddingVertical: 14,
          borderRadius: 12,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: colors.primary, fontWeight: '600' }}>
          {title}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isLoading}
      style={{
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          paddingVertical: 16,
          alignItems: 'center',
          borderRadius: 14,
        }}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text
            style={{
              color: '#FFFFFF',
              fontWeight: '700',
              fontSize: 15,
            }}
          >
            {title}
          </Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}
