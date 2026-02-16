import { Pressable, Text, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, gradients } from '../../constants/theme';

type ButtonProps = {
  title: string;
  onPress: () => void | Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'danger';
};

export default function Button({
  title,
  onPress,
  isLoading = false,
  disabled = false,
  variant = 'primary',
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  // 1) GHOST = lien texte
  if (variant === 'ghost') {
    return (
      <Pressable
        onPress={isDisabled ? undefined : onPress}
        style={{
          paddingVertical: 10,
          borderRadius: 8,
          alignItems: 'center',
          opacity: isDisabled ? 0.55 : 1,
        }}
      >
        {isLoading ? (
          <ActivityIndicator />
        ) : (
          <Text
            style={{
              color: colors.primary,
              fontWeight: '600',
              fontSize: 14,
            }}
          >
            {title}
          </Text>
        )}
      </Pressable>
    );
  }

  const isDanger = variant === 'danger';

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      style={{
        borderRadius: 10,
        overflow: 'hidden',
        opacity: isDisabled ? 0.75 : 1,
      }}
    >
      {isDanger ? (
        // DANGER = fond rouge
        <Pressable
          style={{
            paddingVertical: 12,
            paddingHorizontal: 18,
            alignItems: 'center',
            borderRadius: 10,
            backgroundColor: colors.danger,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              style={{
                color: '#FFFFFF',
                fontWeight: '600',
                fontSize: 14,
              }}
            >
              {title}
            </Text>
          )}
        </Pressable>
      ) : (
        // PRIMARY = gradient
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            paddingVertical: 12,
            paddingHorizontal: 18,
            alignItems: 'center',
            borderRadius: 10,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              style={{
                color: '#FFFFFF',
                fontWeight: '600',
                fontSize: 12,
              }}
            >
              {title}
            </Text>
          )}
        </LinearGradient>
      )}
    </Pressable>
  );
}
