import { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, Button } from '../../components/ui';
import { colors } from '../../constants';
import { supabase } from '../../lib/supabase';

export default function TherapistPatientsPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [rows, setRows] = useState<any[]>([]);

  function handleBackPress() {
    router.back();
  }

  function openPatient(patientId: string) {
    router.push(`/(therapist)/patient/${patientId}/library` as any);
  }

  async function loadPatients() {
    setErrorMessage('');
    setIsLoading(true);

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData?.user) {
        setErrorMessage("Tu n'es pas connecté(e).");
        setIsLoading(false);
        return;
      }

      const therapistId = userData.user.id;

      const { data, error } = await supabase
        .from('therapist_patients')
        .select(
          `
            id,
            patient_id,
            therapist_id,
            status,
            created_at,
            patient_profile:profiles!therapist_patients_patient_id_fkey (
              id,
              display_name,
              role
            )
          `,
        )
        .eq('therapist_id', therapistId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRows(data ?? []);
    } catch (e: any) {
      console.log('LOAD PATIENTS ERROR', e);
      setErrorMessage(e?.message ?? JSON.stringify(e));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPatients();
  }, []);

  return (
    <Screen centered maxWidth={720}>
      {/* HEADER */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text
          style={{ fontSize: 26, fontWeight: '900', color: colors.textPrimary }}
        >
          Mes patients
        </Text>

        <Button title="Retour" variant="ghost" onPress={handleBackPress} />
      </View>

      <Text style={{ marginTop: 8, color: colors.textSecondary }}>
        Sélectionne un patient pour voir ses contenus partagés.
      </Text>

      {errorMessage.length > 0 ? (
        <Text style={{ marginTop: 12, color: colors.danger }}>
          {errorMessage}
        </Text>
      ) : null}

      {isLoading ? (
        <View style={{ marginTop: 16, alignItems: 'center', gap: 10 }}>
          <ActivityIndicator />
          <Text style={{ color: colors.textSecondary }}>Chargement…</Text>
        </View>
      ) : (
        <View style={{ marginTop: 16, gap: 10 }}>
          {rows.length === 0 ? (
            <Text style={{ color: colors.textSecondary }}>
              Aucun patient actif pour le moment.
            </Text>
          ) : (
            rows.map((r) => {
              const patientId = String(r.patient_id);

              const rawName = r?.patient_profile?.display_name;

              const displayName =
                typeof rawName === 'string' && rawName.trim().length > 0
                  ? rawName.trim()
                  : 'Patient';

              return (
                <Pressable
                  key={String(r.id)}
                  onPress={() => openPatient(patientId)}
                  style={{
                    padding: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 12,
                    backgroundColor: colors.cardBackground,
                  }}
                >
                  <Text
                    style={{ fontWeight: '800', color: colors.textPrimary }}
                  >
                    {displayName}
                  </Text>

                  <Text style={{ marginTop: 8, color: colors.textSecondary }}>
                    Appuie pour voir les contenus partagés →
                  </Text>
                </Pressable>
              );
            })
          )}
        </View>
      )}
    </Screen>
  );
}
