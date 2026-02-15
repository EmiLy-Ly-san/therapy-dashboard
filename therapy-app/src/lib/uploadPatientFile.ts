import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

import { supabase } from './supabase';

function getItemType(mimeType?: string) {
  if (!mimeType) return 'file';
  if (mimeType.startsWith('image/')) return 'photo';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  return 'file';
}

// base64 -> Uint8Array (simple)
function base64ToUint8Array(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

export async function uploadPatientFile() {
  console.log('uploadPatientFile: start');
  // 1) Choisir un fichier
  const result = await DocumentPicker.getDocumentAsync({
    multiple: false,
    copyToCacheDirectory: true,
  });

  if (result.canceled) {
    return { ok: false as const, reason: 'canceled' as const };
  }

  const file = result.assets[0];

  // 2) User connecté
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;

  const user = authData.user;
  if (!user) throw new Error('Utilisateur non connecté');

  // 3) Infos fichier
  const mimeType = file.mimeType ?? 'application/octet-stream';
  const type = getItemType(mimeType);

  const fileName = file.name ?? 'Fichier';
  const fileExt = fileName.includes('.') ? fileName.split('.').pop() : 'bin';

  const storageBucket = 'patient-files';
  const storagePath = `patients/${user.id}/${Date.now()}.${fileExt}`;
  console.log('picked file:', file?.name, file?.mimeType, file?.uri);

  // 4) Préparer le contenu à uploader (web vs mobile)
  let uploadBody: Blob | Uint8Array;

  if (Platform.OS === 'web') {
    const response = await fetch(file.uri);
    uploadBody = await response.blob();
  } else {
    const base64 = await FileSystem.readAsStringAsync(file.uri, {
      // "EncodingType" n'existe pas toujours dans les types => on met 'base64'
      encoding: 'base64' as any,
    });

    uploadBody = base64ToUint8Array(base64);
  }
  console.log('uploading to:', storageBucket, storagePath);
  // 5) Upload Storage
  const { error: uploadError } = await supabase.storage
    .from(storageBucket)
    .upload(storagePath, uploadBody, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    console.log('UPLOAD ERROR:', uploadError);
    throw uploadError;
  }

  // 6) Insert DB (table items)
  const { error: dbError } = await supabase.from('items').insert({
    patient_id: user.id,
    type,
    title: fileName,
    storage_bucket: storageBucket,
    storage_path: storagePath,
    mime_type: mimeType,
  });

  if (dbError) {
    console.log('DB ERROR:', dbError);
    throw dbError;
  }

  return { ok: true as const, storagePath };
}
