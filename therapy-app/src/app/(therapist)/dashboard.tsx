import { useEffect, useState } from 'react';
import { Text, View, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';

import LogoutButton from '../../components/auth/LogoutButton';
import { Screen } from '../../components/ui';
import { colors } from '../../constants';

import DashboardSectionCard from '../../components/dashboard/DashboardSectionCard';
import { supabase } from '../../lib/supabase';

import TherapistPatientsList from '../../components/therapist/TherapistPatientsList';

export default function TherapistDashboardPage() {
  const router = useRouter();
  const isWeb = Platform.OS === 'web';

  const [displayName, setDisplayName] = useState<string>('');

  function openPatient(patientId: string, patientName: string) {
    router.push({
      pathname: '/(therapist)/patient/[patientId]/library',
      params: {
        patientId,
        patientName,
      },
    } as any);
  }

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
        setDisplayName(raw);
      }
    }
  }

  useEffect(() => {
    loadDisplayName();
  }, []);

  return (
    <Screen>
      <View
        style={{
          width: '100%',
          maxWidth: isWeb ? 720 : '100%',
          alignSelf: 'center',
          gap: 24,
        }}
      >
        {/* HEADER (même esprit que patient) */}
        <View style={{ gap: 16 }}>
          <Image
            source={require('../../assets/images/therapy-dashboard-little.svg')}
            style={{ width: 180, height: 42 }}
            resizeMode="contain"
          />

          <Text
            style={{
              fontSize: 18,
              fontWeight: '500',
              color: colors.textPrimary,
            }}
          >
            {displayName ? `Bonjour, ${displayName}` : 'Bonjour'}
          </Text>
        </View>

        {/* LISTE PATIENTS (directement sur le dashboard, avec recherche) */}
        <DashboardSectionCard
          iconName="users"
          title="Mes patients"
          description="Sélectionne un patient pour voir les contenus partagés."
        >
          <TherapistPatientsList onOpenPatient={openPatient} />
        </DashboardSectionCard>

        {/* COMPTE */}
        <DashboardSectionCard
          iconName="user"
          title="Compte"
          description="Gérer ma session"
        >
          <LogoutButton redirectTo="/" />
        </DashboardSectionCard>
      </View>
    </Screen>
  );
}
