import { useState } from 'react';
import { View, Text, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, Card, Button } from '../../components/ui';
import { colors } from '../../constants';
import { supabase } from '../../lib/supabase';

export default function WritePage() {
  const router = useRouter();

  const [textValue, setTextValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSavePress() {
    setErrorMessage('');

    const cleanText = textValue.trim();
    if (cleanText.length === 0) {
      setErrorMessage('Écris au moins une phrase 🙂');
      return;
    }

    setIsSaving(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      setIsSaving(false);
      setErrorMessage('Tu dois être connecté(e) pour écrire.');
      return;
    }

    const userId = userData.user.id;

    const { error: insertError } = await supabase.from('items').insert({
      patient_id: userId,
      type: 'text',
      title: 'Entrée du jour',
      text_content: cleanText,
    });

    setIsSaving(false);

    if (insertError) {
      setErrorMessage(insertError.message);
      return;
    }

    router.replace('/(patient)/dashboard' as any);
  }

  return (
    <Screen>
      <View
        style={{
          width: '100%',
          maxWidth: Platform.OS === 'web' ? 720 : '100%',
        }}
      >
        <Text
          style={{ fontSize: 28, fontWeight: '800', color: colors.textPrimary }}
        >
          Écrire aujourd’hui
        </Text>

        <Text
          style={{
            marginTop: 6,
            marginBottom: 16,
            color: colors.textSecondary,
          }}
        >
          Une note privée pour déposer ce que tu ressens.
        </Text>

        <Card>
          <TextInput
            multiline
            placeholder="Commence à écrire..."
            value={textValue}
            onChangeText={setTextValue}
            style={{
              minHeight: 220,
              fontSize: 16,
              color: colors.textPrimary,
              textAlignVertical: 'top',
            }}
          />
        </Card>

        {errorMessage.length > 0 ? (
          <Text style={{ marginTop: 10, color: colors.danger }}>
            {errorMessage}
          </Text>
        ) : null}

        <View style={{ marginTop: 16 }}>
          <Button
            title={isSaving ? 'Enregistrement...' : 'Enregistrer'}
            onPress={handleSavePress}
            isLoading={isSaving}
          />
        </View>
      </View>
    </Screen>
  );
}
