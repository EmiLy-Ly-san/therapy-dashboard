import { useEffect, useMemo, useState } from 'react';
import {
  Text,
  View,
  Platform,
  ActivityIndicator,
  Pressable,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';

import LogoutButton from '../../components/auth/LogoutButton';
import { Screen, Input } from '../../components/ui';
import { colors } from '../../constants';

import DashboardSectionCard from '../../components/dashboard/DashboardSectionCard';
import { supabase } from '../../lib/supabase';

import { useDisplayName } from '../../hooks/useDisplayName';

export default function TherapistDashboardPage() {
  const router = useRouter();
  const isWeb = Platform.OS === 'web';

  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchValue, setSearchValue] = useState('');

  const { displayName } = useDisplayName(); // nom complet

  function handleSearchChange(textValue: string) {
    setSearchValue(textValue);
  }

  function openPatient(patientId: string, patientName: string) {
    router.push({
      pathname: '/(therapist)/patient/[patientId]/library',
      params: {
        patientId,
        patientName,
      },
    } as any);
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

  const visibleRows = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (q.length === 0) return rows;

    return rows.filter((r) => {
      const rawName = r?.patient_profile?.display_name;
      const name =
        typeof rawName === 'string' && rawName.trim().length > 0
          ? rawName.trim()
          : 'Patient';
      return name.toLowerCase().includes(q);
    });
  }, [rows, searchValue]);

  const patientCount = rows.length;

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
            source={require('../../assets/images/therapy-dashboard-little.png')}
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

        {errorMessage.length > 0 ? (
          <Text style={{ color: colors.danger }}>{errorMessage}</Text>
        ) : null}

        {/* SEARCH */}
        <Input
          placeholder="Rechercher (patients…)"
          style={{ fontSize: 12 }}
          onChangeText={handleSearchChange}
          value={searchValue}
        />

        {/* LISTE PATIENTS */}
        <DashboardSectionCard
          iconName="users"
          title="Mes patients"
          description={`Patients actifs : ${patientCount}`}
        >
          {isLoading ? (
            <View style={{ paddingVertical: 8, alignItems: 'center' }}>
              <ActivityIndicator />
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {visibleRows.length === 0 ? (
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  Aucun patient actif pour le moment.
                </Text>
              ) : (
                visibleRows.map((r) => {
                  const patientId = String(r.patient_id);

                  const rawName = r?.patient_profile?.display_name;
                  const patientDisplayName =
                    typeof rawName === 'string' && rawName.trim().length > 0
                      ? rawName.trim()
                      : 'Patient';

                  return (
                    <Pressable
                      key={String(r.id)}
                      onPress={() => openPatient(patientId, patientDisplayName)}
                      style={{
                        padding: 12,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 12,
                        backgroundColor: colors.cardBackground,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <View
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#EEF2FF',
                        }}
                      >
                        <Text
                          style={{ color: colors.primary, fontWeight: '800' }}
                        >
                          {patientDisplayName.slice(0, 1).toUpperCase()}
                        </Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontWeight: '800',
                            color: colors.textPrimary,
                          }}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {patientDisplayName}
                        </Text>

                        <Text
                          style={{
                            marginTop: 4,
                            color: colors.textSecondary,
                            fontSize: 12,
                          }}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          Appuie pour voir les contenus partagés →
                        </Text>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>
          )}
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
