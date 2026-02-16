import { useEffect, useState } from 'react';
import { View, Text, TextInput, Alert, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Card, Button } from '../ui';
import { supabase } from '../../lib/supabase';
import { colors } from '../../constants';

type Props = {
  itemId: string;
};

export default function ItemNotesSection({ itemId }: Props) {
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // mode édition
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  async function loadNotes() {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return;

    const userId = userData.user.id;

    const { data, error } = await supabase
      .from('item_notes')
      .select('id, note, created_at')
      .eq('item_id', itemId)
      .eq('patient_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.log('loadNotes error', error);
      return;
    }

    setNotes(data || []);
  }

  async function handleAddNote() {
    const clean = newNote.trim();
    if (clean.length === 0) return;

    setIsSaving(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      setIsSaving(false);
      return;
    }

    const userId = userData.user.id;

    const { error } = await supabase.from('item_notes').insert({
      item_id: itemId,
      patient_id: userId,
      note: clean,
    });

    setIsSaving(false);

    if (error) {
      Alert.alert('Erreur', error.message);
      return;
    }

    setNewNote('');
    loadNotes();
  }

  function startEdit(noteRow: any) {
    setEditingId(String(noteRow.id));
    setEditingText(noteRow.note ? String(noteRow.note) : '');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingText('');
  }

  async function saveEdit() {
    if (!editingId) return;

    const clean = editingText.trim();
    if (clean.length === 0) {
      Alert.alert('Erreur', 'La note ne peut pas être vide.');
      return;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return;

    const userId = userData.user.id;

    setIsSaving(true);

    const { error } = await supabase
      .from('item_notes')
      .update({ note: clean })
      .eq('id', editingId)
      .eq('patient_id', userId);

    setIsSaving(false);

    if (error) {
      Alert.alert('Erreur', error.message);
      return;
    }

    cancelEdit();
    loadNotes();
  }

  async function deleteNote(noteId: string) {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return;

    const userId = userData.user.id;

    const { error } = await supabase
      .from('item_notes')
      .delete()
      .eq('id', noteId)
      .eq('patient_id', userId);

    if (error) {
      Alert.alert('Erreur', error.message);
      return;
    }

    if (editingId === noteId) cancelEdit();

    loadNotes();
  }

  useEffect(() => {
    loadNotes();
  }, [itemId]);

  return (
    <View style={{ marginTop: 24 }}>
      <Text
        style={{
          fontSize: 16,
          fontWeight: '600',
          color: colors.textPrimary,
          marginBottom: 12,
        }}
      >
        Notes
      </Text>

      {/* AJOUT NOTE */}
      <Card>
        <TextInput
          placeholder="Ajouter une note..."
          value={newNote}
          onChangeText={setNewNote}
          multiline
          style={{
            minHeight: 90,
            textAlignVertical: 'top',
            color: colors.textSecondary,
            paddingTop: 10,
            fontSize: 12,
          }}
        />

        <View style={{ marginTop: 12 }}>
          <Button
            title={isSaving ? 'Ajout...' : 'Ajouter'}
            onPress={handleAddNote}
            isLoading={isSaving}
          />
        </View>
      </Card>

      {/* LISTE NOTES */}
      <View style={{ marginTop: 16, gap: 12 }}>
        {notes.map((n) => {
          const noteId = String(n.id);
          const isEditing = editingId === noteId;

          return (
            <Card key={noteId}>
              {isEditing ? (
                <>
                  <TextInput
                    value={editingText}
                    onChangeText={setEditingText}
                    multiline
                    style={{
                      minHeight: 90,
                      textAlignVertical: 'top',
                      color: colors.textPrimary,
                      paddingTop: 10,
                      fontSize: 15,
                    }}
                  />

                  {/* Boutons alignés, propre */}
                  <View
                    style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}
                  >
                    <View style={{ flex: 1 }}>
                      <Button
                        title={isSaving ? '...' : 'Enregistrer'}
                        onPress={saveEdit}
                        isLoading={isSaving}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Button
                        title="Annuler"
                        variant="ghost"
                        onPress={cancelEdit}
                      />
                    </View>
                  </View>
                </>
              ) : (
                <>
                  {/* Ligne du haut : texte + actions (icônes à droite) */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: 12,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{ color: colors.textPrimary, lineHeight: 20 }}
                      >
                        {String(n.note || '')}
                      </Text>
                    </View>

                    {/* Actions (icônes) */}
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      {/* Modifier */}
                      <Pressable
                        onPress={() => startEdit(n)}
                        style={{
                          padding: 6,
                          borderRadius: 999,
                        }}
                        hitSlop={8}
                      >
                        <Feather
                          name="edit-3"
                          size={18}
                          color={colors.primary}
                        />
                      </Pressable>

                      {/* Supprimer (poubelle violette) */}
                      <Pressable
                        onPress={() => deleteNote(noteId)}
                        style={{
                          padding: 6,
                          borderRadius: 999,
                        }}
                        hitSlop={8}
                      >
                        <Feather
                          name="trash-2"
                          size={18}
                          color={colors.primary}
                        />
                      </Pressable>
                    </View>
                  </View>
                </>
              )}
            </Card>
          );
        })}
      </View>
    </View>
  );
}
