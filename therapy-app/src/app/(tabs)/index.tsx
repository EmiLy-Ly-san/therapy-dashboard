import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { supabase } from '../../lib/supabase';

type Entry = {
  id: string;
  created_at: string;
  title: string | null;
};

export default function HomeScreen() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadEntries = async () => {
    setErrorMsg(null);
    const res = await supabase
      .from('entries')
      .select('*')
      .order('created_at', { ascending: false });

    if (res.error) {
      console.log('ERROR loadEntries', res.error);
      setErrorMsg(res.error.message);
      return;
    }
    setEntries((res.data ?? []) as Entry[]);
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const addEntry = async () => {
    try {
      setLoadingAdd(true);
      setErrorMsg(null);

      const title = `Entry ${new Date().toLocaleString()}`;

      const res = await supabase
        .from('entries')
        .insert([{ title }])
        .select()
        .single();

      if (res.error) {
        console.log('ERROR addEntry', res.error);
        setErrorMsg(res.error.message);
        return;
      }

      setEntries((prev) => [res.data as Entry, ...prev]);
    } finally {
      setLoadingAdd(false);
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      setDeletingId(id);
      setErrorMsg(null);

      const res = await supabase.from('entries').delete().eq('id', id);

      if (res.error) {
        console.log('ERROR deleteEntry', res.error);
        setErrorMsg(res.error.message);
        return;
      }

      setEntries((prev) => prev.filter((e) => e.id !== id));

      // si on supprimait celle qu’on éditait
      if (editingId === id) {
        setEditingId(null);
        setDraftTitle('');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (entry: Entry) => {
    setErrorMsg(null);
    setEditingId(entry.id);
    setDraftTitle(entry.title ?? '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftTitle('');
  };

  const saveEdit = async (id: string) => {
    try {
      setSavingId(id);
      setErrorMsg(null);

      const newTitle = draftTitle.trim();

      const res = await supabase
        .from('entries')
        .update({ title: newTitle })
        .eq('id', id)
        .select()
        .single();

      if (res.error) {
        console.log('ERROR saveEdit', res.error);
        setErrorMsg(res.error.message);
        return;
      }

      // update local
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? (res.data as Entry) : e)),
      );

      setEditingId(null);
      setDraftTitle('');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <View className="flex-1 bg-white px-6 pt-16">
      <Text className="text-2xl font-semibold text-black mb-4">Entries</Text>

      <Pressable
        onPress={addEntry}
        disabled={loadingAdd}
        className={`rounded-xl px-4 py-3 mb-6 ${
          loadingAdd ? 'bg-gray-300' : 'bg-black'
        }`}
      >
        <Text className="text-white text-center font-semibold">
          {loadingAdd ? 'Ajout...' : 'Ajouter une entry'}
        </Text>
      </Pressable>

      {errorMsg ? <Text className="text-red-600 mb-4">{errorMsg}</Text> : null}

      {entries.length === 0 ? (
        <Text className="text-gray-600">Aucune entry pour l’instant.</Text>
      ) : (
        entries.map((e) => {
          const isEditing = editingId === e.id;
          const isDeleting = deletingId === e.id;
          const isSaving = savingId === e.id;

          return (
            <View key={e.id} className="w-full py-3 border-b border-gray-200">
              <View className="flex-row items-center justify-between gap-3">
                <View className="flex-1">
                  {isEditing ? (
                    <TextInput
                      value={draftTitle}
                      onChangeText={setDraftTitle}
                      placeholder="Titre..."
                      className="border border-gray-300 rounded-lg px-3 py-2 text-black"
                      autoFocus
                    />
                  ) : (
                    <Text className="text-black">
                      • {e.title ?? '(sans titre)'}
                    </Text>
                  )}
                </View>

                {!isEditing ? (
                  <Pressable
                    onPress={() => startEdit(e)}
                    className="rounded-lg px-3 py-2 bg-gray-200"
                  >
                    <Text className="text-black font-semibold">Modifier</Text>
                  </Pressable>
                ) : (
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => saveEdit(e.id)}
                      disabled={isSaving}
                      className={`rounded-lg px-3 py-2 ${
                        isSaving ? 'bg-gray-300' : 'bg-black'
                      }`}
                    >
                      <Text className="text-white font-semibold">
                        {isSaving ? '...' : 'Enregistrer'}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={cancelEdit}
                      className="rounded-lg px-3 py-2 bg-gray-200"
                    >
                      <Text className="text-black font-semibold">Annuler</Text>
                    </Pressable>
                  </View>
                )}

                <Pressable
                  onPress={() => deleteEntry(e.id)}
                  disabled={isDeleting || isSaving}
                  className={`rounded-lg px-3 py-2 ${
                    isDeleting ? 'bg-gray-200' : 'bg-red-600'
                  }`}
                >
                  <Text className="text-white font-semibold">
                    {isDeleting ? '...' : 'Supprimer'}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}
