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
          paddingVertical: 14,
          borderRadius: 12,
          alignItems: 'center',
          opacity: isDisabled ? 0.55 : 1,
        }}
      >
        {isLoading ? (
          <ActivityIndicator />
        ) : (
          <Text style={{ color: colors.primary, fontWeight: '600' }}>
            {title}
          </Text>
        )}
      </Pressable>
    );
  }

  // 2) PRIMARY ou DANGER = bouton plein
  const isDanger = variant === 'danger';

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      style={{
        borderRadius: 14,
        overflow: 'hidden',
        opacity: isDisabled ? 0.75 : 1,
      }}
    >
      {isDanger ? (
        // DANGER = fond rouge
        <Pressable
          style={{
            paddingVertical: 16,
            alignItems: 'center',
            borderRadius: 14,
            backgroundColor: colors.danger,
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
        </Pressable>
      ) : (
        // PRIMARY = gradient
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
      )}
    </Pressable>
  );
}
