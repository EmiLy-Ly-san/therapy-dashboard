import { useState } from 'react';
import { View, Text, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, Card, Button } from '../../components/ui';
import { colors } from '../../constants';
import { supabase } from '../../lib/supabase';

import PageHeader from '../../components/common/PageHeader';

export default function WritePage() {
  const router = useRouter();

  const [textValue, setTextValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  function handleBackPress() {
    router.replace('/(patient)/dashboard' as any);
  }

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
          alignSelf: 'center',
          gap: 16,
        }}
      >
        <PageHeader
          title="Écrire aujourd’hui"
          iconName="edit-3"
          onBack={handleBackPress}
          subtitle="Une note privée pour déposer ce que tu ressens."
        />

        <Card
          style={{
            borderRadius: 18,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.cardBackground,
          }}
        >
          <TextInput
            multiline
            placeholder="Commence à écrire..."
            value={textValue}
            onChangeText={setTextValue}
            style={{
              minHeight: 240,
              fontSize: 15,
              color: colors.textPrimary,
              textAlignVertical: 'top',
              paddingTop: 12,
              lineHeight: 22,
            }}
            placeholderTextColor={colors.textSecondary}
          />
        </Card>

        {errorMessage.length > 0 ? (
          <Text style={{ marginTop: 2, color: colors.danger }}>
            {errorMessage}
          </Text>
        ) : null}

        <View style={{ marginTop: 4 }}>
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
