/**
 * TherapistPatientsList.tsx
 * -------------------------
 * Composant réutilisable :
 * - Charge les patients actifs du therapist connecté
 * - Affiche une recherche
 * - Affiche une liste cliquable
 *
 * Utilisation :
 * <TherapistPatientsList onOpenPatient={(id, name) => ...} />
 */

import { useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';

import { colors } from '../../constants';
import { supabase } from '../../lib/supabase';
import { Input } from '../ui';

type Props = {
  onOpenPatient: (patientId: string, patientName: string) => void;
};

function safeDisplayName(row: any) {
  const rawName = row?.patient_profile?.display_name;
  const name =
    typeof rawName === 'string' && rawName.trim().length > 0
      ? rawName.trim()
      : 'Patient';
  return name;
}

export default function TherapistPatientsList({ onOpenPatient }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [searchValue, setSearchValue] = useState('');

  async function loadPatients() {
    setErrorMessage('');
    setIsLoading(true);

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData?.user) {
        setErrorMessage("Tu n'es pas connecté(e).");
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
    if (!q) return rows;

    return rows.filter((r) => {
      const name = safeDisplayName(r);
      return name.toLowerCase().includes(q);
    });
  }, [rows, searchValue]);

  const patientCount = rows.length;

  if (errorMessage.length > 0) {
    return <Text style={{ color: colors.danger }}>{errorMessage}</Text>;
  }

  return (
    <View style={{ gap: 10 }}>
      <Input
        placeholder="Rechercher (patients…)"
        style={{ fontSize: 12 }}
        onChangeText={setSearchValue}
        value={searchValue}
      />

      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
        Patients actifs : {patientCount}
      </Text>

      {isLoading ? (
        <View style={{ paddingVertical: 8, alignItems: 'center' }}>
          <ActivityIndicator />
        </View>
      ) : visibleRows.length === 0 ? (
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
          Aucun patient actif pour le moment.
        </Text>
      ) : (
        <View style={{ gap: 10 }}>
          {visibleRows.map((r) => {
            const patientId = String(r.patient_id);
            const displayName = safeDisplayName(r);

            return (
              <Pressable
                key={String(r.id)}
                onPress={() => onOpenPatient(patientId, displayName)}
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
                  <Text style={{ color: colors.primary, fontWeight: '800' }}>
                    {displayName.slice(0, 1).toUpperCase()}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontWeight: '800', color: colors.textPrimary }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {displayName}
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
          })}
        </View>
      )}
    </View>
  );
}
