import { useEffect, useState } from 'react';
import { Text, View, Platform } from 'react-native';

import LogoutButton from '../../components/auth/LogoutButton';
import { Screen, Button, Input } from '../../components/ui';
import { colors } from '../../constants';

import DashboardSectionCard from '../../components/dashboard/DashboardSectionCard';
import { supabase } from '../../lib/supabase';
import useTherapistDashboardActions from '../../hooks/useTherapistDashboardActions';

export default function TherapistDashboardPage() {
  const isWeb = Platform.OS === 'web';

  const { goToPatientsPage } = useTherapistDashboardActions();

  const [patientCount, setPatientCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState('');

  function handleSearchChange(textValue: string) {
    console.log('Recherche therapist:', textValue);
  }

  async function loadCounts() {
    setErrorMessage('');

    try {
      // Compte patients actifs
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData?.user) {
        setErrorMessage("Tu n'es pas connecté(e).");
        return;
      }

      const therapistId = userData.user.id;

      const { count, error } = await supabase
        .from('therapist_patients')
        .select('id', { count: 'exact', head: true })
        .eq('therapist_id', therapistId)
        .eq('status', 'active');

      if (error) throw error;
      setPatientCount(count ?? 0);
    } catch (e: any) {
      console.log('LOAD COUNTS ERROR', e);
      setErrorMessage(e?.message ?? JSON.stringify(e));
    }
  }

  useEffect(() => {
    loadCounts();
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
        {/* HEADER */}
        <View>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '800',
              color: colors.textPrimary,
            }}
          >
            Dashboard
          </Text>

          <Text style={{ marginTop: 6, color: colors.textSecondary }}>
            Espace thérapeute
          </Text>
        </View>

        {errorMessage.length > 0 ? (
          <Text style={{ color: colors.danger }}>{errorMessage}</Text>
        ) : null}

        {/* SEARCH */}
        <Input
          placeholder="Rechercher (patients…)"
          onChangeText={handleSearchChange}
        />

        {/* PATIENTS */}
        <DashboardSectionCard
          title="👥 Mes patients"
          description={`Patients actifs : ${patientCount}`}
        >
          <Button title="Voir mes patients" onPress={goToPatientsPage} />
        </DashboardSectionCard>

        {/* COMPTE */}
        <DashboardSectionCard title="👤 Compte" description="Gérer ma session">
          <LogoutButton redirectTo="/" />
        </DashboardSectionCard>
      </View>
    </Screen>
  );
}
