import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, Button } from '../../components/ui';
import { colors } from '../../constants';
import { supabase } from '../../lib/supabase';

export default function TherapistDashboardPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string>('');

  async function loadDisplayName() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;

    const { data } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', userData.user.id)
      .maybeSingle();

    if (data?.display_name) {
      const raw = String(data.display_name).trim();
      if (raw.length > 0) {
        setDisplayName(raw.split(' ')[0]);
      }
    }
  }

  useEffect(() => {
    loadDisplayName();
  }, []);

  return (
    <Screen centered>
      <View style={{ width: '100%', maxWidth: 720 }}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: '800',
            color: colors.textPrimary,
          }}
        >
          {displayName ? `Bonjour, ${displayName}` : 'Bonjour'}
        </Text>

        <View style={{ marginTop: 24 }}>
          <Button
            title="Voir mes patients"
            onPress={() => router.push('/(therapist)/patients' as any)}
          />
        </View>
      </View>
    </Screen>
  );
}
