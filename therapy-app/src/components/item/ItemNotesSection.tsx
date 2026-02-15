/**
 * ItemNotesSection.tsx
 * --------------------
 * Gère :
 * - affichage des notes liées à un item
 * - ajout d'une nouvelle note
 *
 * Utilise la table item_notes
 */

import { useEffect, useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { Button, Card } from '../ui';
import { supabase } from '../../lib/supabase';
import { colors } from '../../constants';

type Props = {
  itemId: string;
};

export default function ItemNotesSection({ itemId }: Props) {
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function loadNotes() {
    const { data } = await supabase
      .from('item_notes')
      .select('*')
      .eq('item_id', itemId)
      .order('created_at', { ascending: false });

    setNotes(data || []);
  }

  async function handleAddNote() {
    if (newNote.trim().length === 0) return;

    setIsSaving(true);

    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) {
      setIsSaving(false);
      return;
    }

    await supabase.from('item_notes').insert({
      item_id: itemId,
      patient_id: userData.user.id,
      note: newNote.trim(),
    });

    setNewNote('');
    setIsSaving(false);
    loadNotes();
  }

  useEffect(() => {
    loadNotes();
  }, []);

  return (
    <View style={{ marginTop: 24 }}>
      <Text
        style={{
          fontSize: 18,
          fontWeight: '700',
          color: colors.textPrimary,
          marginBottom: 12,
        }}
      >
        Notes
      </Text>

      {/* Formulaire */}
      <Card>
        <TextInput
          placeholder="Ajouter une note..."
          value={newNote}
          onChangeText={setNewNote}
          multiline
          style={{
            minHeight: 80,
            textAlignVertical: 'top',
            color: colors.textPrimary,
          }}
        />

        <View style={{ marginTop: 10 }}>
          <Button
            title={isSaving ? 'Ajout...' : 'Ajouter'}
            onPress={handleAddNote}
            isLoading={isSaving}
          />
        </View>
      </Card>

      {/* Liste */}
      <View style={{ marginTop: 16, gap: 12 }}>
        {notes.map((n) => (
          <Card key={n.id}>
            <Text style={{ color: colors.textPrimary }}>{n.note}</Text>
          </Card>
        ))}
      </View>
    </View>
  );
}
