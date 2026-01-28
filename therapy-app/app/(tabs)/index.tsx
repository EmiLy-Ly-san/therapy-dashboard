import { Text, View } from 'react-native';
import { useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';

export default function HomeScreen() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      console.log('session:', data.session, 'error:', error);
    });
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
      <Text>Supabase test</Text>
    </View>
  );
}
