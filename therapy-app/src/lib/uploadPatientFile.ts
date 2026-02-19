/**
 * uploadPatientFile.ts
 * --------------------
 * Upload compatible Android / iOS / Web (Expo + Supabase Storage)
 */

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import { supabase } from './supabase';

function getItemType(mimeType?: string) {
  if (!mimeType) return 'file';
  if (mimeType.startsWith('image/')) return 'photo';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  return 'file';
}

export async function uploadPatientFile() {
  console.log('uploadPatientFile: start');

  const result = await DocumentPicker.getDocumentAsync({
    multiple: false,
    copyToCacheDirectory: true,
  });

  if (result.canceled) {
    return { ok: false as const, reason: 'canceled' as const };
  }

  const file = result.assets[0];

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;

  const user = authData.user;
  if (!user) throw new Error('Utilisateur non connecté');

  const mimeType = file.mimeType ?? 'application/octet-stream';
  const type = getItemType(mimeType);

  const fileName = file.name ?? 'Fichier';
  const fileExt = fileName.includes('.') ? fileName.split('.').pop() : 'bin';

  const storageBucket = 'patient-files';
  const storagePath = `patients/${user.id}/${Date.now()}.${fileExt}`;

  console.log('picked file:', file?.name, file?.mimeType, file?.uri);
  console.log('storage path:', storageBucket, storagePath);

  // WEB : upload via supabase-js (OK)
  if (Platform.OS === 'web') {
    const response = await fetch(file.uri);
    const uploadBody = await response.blob();

    const { error: uploadError } = await supabase.storage
      .from(storageBucket)
      .upload(storagePath, uploadBody, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.log('UPLOAD ERROR (web):', uploadError);
      throw uploadError;
    }
  } else {
    // MOBILE : uploadAsync natif (évite fetch(file://...) qui casse sur Android)
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      throw new Error(
        'Variables Supabase manquantes (EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY)',
      );
    }

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError) throw sessionError;

    const accessToken = sessionData.session?.access_token;
    if (!accessToken) throw new Error('Pas de session Supabase');

    const uploadUrl = `${supabaseUrl}/storage/v1/object/${storageBucket}/${storagePath}`;

    const uploadResult = await FileSystem.uploadAsync(uploadUrl, file.uri, {
      httpMethod: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: anonKey,
        'Content-Type': mimeType,
        'x-upsert': 'false',
      },
      // ✅ pas de uploadType : compatible avec les typings expo-file-system actuels
    });

    if (uploadResult.status !== 200) {
      console.log('UPLOAD RESULT STATUS:', uploadResult.status);
      console.log('UPLOAD RESULT BODY:', uploadResult.body);
      throw new Error('Upload échoué (mobile)');
    }
  }

  // DB insert
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
