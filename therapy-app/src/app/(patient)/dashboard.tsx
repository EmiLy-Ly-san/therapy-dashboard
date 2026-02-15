import { useState } from 'react';
import { Text, View, Switch } from 'react-native';

import { Screen, Card, Button, Input } from '../../components/ui';
import { colors } from '../../constants';
import { supabase } from '../../lib/supabase';

function Chip({ label }: { label: string }) {
  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.cardBackground,
      }}
    >
      <Text
        style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}
      >
        {label}
      </Text>
    </View>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={{ marginTop: 18 }}>
      <Text
        style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ marginTop: 6, color: colors.textSecondary }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

export default function PatientDashboardPage() {
  const [isPrivateMode, setIsPrivateMode] = useState(true);

  async function handleLogoutButtonPress() {
    await supabase.auth.signOut();
  }

  function handleUploadPress() {
    console.log('Upload à faire plus tard');
  }

  function handleNewEntryPress() {
    console.log('Créer une entrée à faire plus tard');
  }

  return (
    <Screen centered maxWidth={900}>
      {/* Header */}
      <View style={{ marginTop: 6 }}>
        <Text
          style={{ fontSize: 28, fontWeight: '900', color: colors.textPrimary }}
        >
          Dashboard
        </Text>
        <Text style={{ marginTop: 6, color: colors.textSecondary }}>
          Espace patient
        </Text>
      </View>

      {/* Search / quick input */}
      <View style={{ marginTop: 16 }}>
        <Input placeholder="Rechercher (notes, fichiers…)" />
      </View>

      {/* 2 cards top : Actions + Confidentialité */}
      <View style={{ marginTop: 16, gap: 12 }}>
        <Card>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '800',
              color: colors.textPrimary,
            }}
          >
            Actions rapides
          </Text>
          <Text style={{ marginTop: 6, color: colors.textSecondary }}>
            Commencer une entrée ou déposer un fichier.
          </Text>

          <View style={{ marginTop: 14, gap: 10 }}>
            <Button title="Nouvelle entrée" onPress={handleNewEntryPress} />
            <Button
              title="Déposer un fichier"
              onPress={handleUploadPress}
              variant="ghost"
            />
          </View>
        </Card>

        <Card>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '800',
                  color: colors.textPrimary,
                }}
              >
                Mode privé
              </Text>
              <Text
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: colors.textSecondary,
                }}
              >
                Visible uniquement par moi
              </Text>
            </View>

            <Switch value={isPrivateMode} onValueChange={setIsPrivateMode} />
          </View>
        </Card>
      </View>

      {/* Upload Card */}
      <SectionTitle
        title="Partager un fichier"
        subtitle="Ajoute un document, une photo, un audio… (structure prête, logique plus tard)"
      />

      <Card style={{ marginTop: 12 }}>
        <View
          style={{
            borderWidth: 2,
            borderColor: colors.border,
            borderStyle: 'dashed',
            borderRadius: 16,
            paddingVertical: 28,
            paddingHorizontal: 14,
            alignItems: 'center',
            backgroundColor: '#F9FAFB',
          }}
        >
          <Text style={{ fontWeight: '800', color: colors.textPrimary }}>
            Glisser-déposer ou choisir un fichier
          </Text>
          <Text
            style={{
              marginTop: 6,
              color: colors.textSecondary,
              textAlign: 'center',
            }}
          >
            Les fichiers seront visibles dans ton espace patient.
          </Text>

          <View style={{ marginTop: 14, width: '100%' }}>
            <Button title="Choisir un fichier" onPress={handleUploadPress} />
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            gap: 8,
            marginTop: 14,
            flexWrap: 'wrap',
          }}
        >
          <Chip label="Audio" />
          <Chip label="Vidéo" />
          <Chip label="Photo" />
          <Chip label="Vocal" />
          <Chip label="PDF" />
        </View>
      </Card>

      {/* Recent section */}
      <SectionTitle
        title="Dernières entrées"
        subtitle="Pour l’instant, c’est un état vide (on branchera Supabase après)."
      />

      <Card style={{ marginTop: 12 }}>
        <View style={{ gap: 10 }}>
          <View
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 14,
              padding: 12,
            }}
          >
            <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
              (exemple) Séance du 12/02
            </Text>
            <Text style={{ marginTop: 4, color: colors.textSecondary }}>
              Idées clés, émotions, exercices…
            </Text>
          </View>

          <View
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 14,
              padding: 12,
            }}
          >
            <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
              (exemple) Note rapide
            </Text>
            <Text style={{ marginTop: 4, color: colors.textSecondary }}>
              Une phrase, une sensation, un souvenir…
            </Text>
          </View>
        </View>
      </Card>

      {/* Footer */}
      <View style={{ marginTop: 18 }}>
        <Button
          title="Se déconnecter"
          onPress={handleLogoutButtonPress}
          variant="ghost"
        />
      </View>
    </Screen>
  );
}
