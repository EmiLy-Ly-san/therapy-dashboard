import { Text, View } from 'react-native';

import { Screen, Card, Button } from '../../components/ui';
import { colors } from '../../constants';
import { supabase } from '../../lib/supabase';

export default function TherapistDashboardPage() {
  async function handleLogoutButtonPress() {
    await supabase.auth.signOut();
  }

  return (
    <Screen centered>
      <Text
        style={{ fontSize: 24, fontWeight: '800', color: colors.textPrimary }}
      >
        Dashboard Thérapeute
      </Text>

      <Card style={{ marginTop: 16 }}>
        <Text style={{ color: colors.textSecondary }}>
          (vide pour le moment)
        </Text>

        <View style={{ marginTop: 12 }}>
          <Button
            title="Se déconnecter"
            onPress={handleLogoutButtonPress}
            variant="ghost"
          />
        </View>
      </Card>
    </Screen>
  );
}
