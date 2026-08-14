import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AppScrollView } from '@/components/AppScrollView';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { z } from 'zod';
import { authService } from '../../../../api/authService';
import { auth } from '../../../../api/firebase';
import { InfoIdentifiants } from '../../../../components/InfoIdentifiants';
import PhotoProfilPicker from '../../../../components/PhotoProfilPicker';
import SelecteurSexe from '../../../../components/SelecteurSexe';
import ChampDateNaissance from '../../../../components/ChampDateNaissance';
import type { Sexe } from '../../../../types/collection';
import { Colors } from '@/constants/theme';
import { versISO } from '@/utils/dateNaissance';

// Schéma de validation Zod
//
// Ni mot de passe ni confirmation : le backend génère le mot de passe et
// l'envoie par email au patient. Le médecin n'a donc rien à saisir, ni à
// transmettre de vive voix.
//
// `.trim()` avant les contrôles de longueur : une saisie faite d'espaces ne
// doit pas passer pour une valeur renseignée.
const patientSchema = z.object({
  email: z.string().trim().email({ message: "Email invalide" }),
  // Exigés : le médecin retrouve ses patients par leur nom dans sa liste et
  // dans les notifications de prise manquée, jamais par leur email.
  nom: z.string().trim().min(1, { message: "Le nom est requis" }),
  prenom: z.string().trim().min(1, { message: "Le prénom est requis" }),
  tel: z.string().trim()
    .refine((v) => v.replace(/\D/g, '').length >= 9, {
      message: "Numéro trop court (ex: 0341234567)"
    })
    .refine((v) => v.replace(/\D/g, '').length <= 15, {
      message: "Numéro trop long"
    }),
  // Facultative : elle n'entre dans aucun traitement, seulement dans le dossier.
  adresse: z.string().trim().max(200, { message: "Adresse : 200 caractères maximum" }),
});


export default function AddPatient() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '', nom: '', prenom: '', tel: '', adresse: '',
  });
  const [photo, setPhoto] = useState('');
  const [sexe, setSexe] = useState<Sexe | ''>('');
  // Tenue hors du formulaire zod : la saisie 'JJ/MM/AAAA' est convertie à
  // l'envoi seulement, une date en cours de frappe n'ayant pas de forme ISO.
  const [naissance, setNaissance] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // 1. Validation Zod
    const validation = patientSchema.safeParse(form);
    if (!validation.success) {
      Toast.show({
        type: 'error',
        text1: 'Erreur de saisie',
        text2: validation.error.issues[0].message
      });
      return;
    }

    // Vérification avant l'appel
    console.log("Utilisateur actuel avant appel :", auth.currentUser?.email);

    if (!auth.currentUser) {
      Toast.show({
        type: 'error',
        text1: 'Erreur session',
        text2: 'Votre session a expiré. Veuillez vous reconnecter.'
      });
      return;
    }

    const dateNaissance = versISO(naissance);
    if (dateNaissance === null) {
      Toast.show({
        type: 'error',
        text1: 'Date de naissance invalide',
        text2: 'Format attendu : JJ/MM/AAAA',
      });
      return;
    }

    setLoading(true);


    try {
      // 2. Appel au Service (Backend)
      // Le médecin traitant est déduit du token côté serveur : pas de
      // `medecinId` à transmettre ici, contrairement à l'écran de l'admin.
      const propre = validation.data;
      const cree = await authService.registerPatient(propre.email, propre.tel, {
        nom: propre.nom,
        prenom: propre.prenom,
        sexe,
        dateNaissance,
        adresse: propre.adresse,
        photo,
      });

      // Le dossier existe dans tous les cas ; seul l'email a pu échouer. Le
      // dire, sinon le médecin croirait son patient capable de se connecter
      // alors qu'il n'a jamais reçu de mot de passe.
      Toast.show(
        cree.emailEnvoye === false
          ? {
            type: 'error',
            text1: 'Dossier créé, email non envoyé',
            text2: "Signalez-le à un administrateur pour renvoyer les identifiants.",
          }
          : {
            type: 'success',
            text1: 'Succès',
            text2: `Dossier créé — identifiants envoyés à ${propre.email}`,
          },
      );

      router.back(); // Retour à la liste des patients
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.error || "Une erreur est survenue"
      });
      console.log(error.response?.data?.error)
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScrollView
      className="flex-1 bg-emerald-50"
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
      keyboardShouldPersistTaps="handled"
      bottomOffset={20}
    >

        <View className="items-center mb-8">
          <Text className="text-3xl font-black text-emerald-700">Nouveau Patient</Text>
          <Text className="text-slate-500 mt-2 text-center">Enregistrez un patient pour commencer son suivi médical</Text>
        </View>

        <View className="bg-white p-6 rounded-[32px] shadow-xl shadow-emerald-100 border border-white">
          <PhotoProfilPicker
            valeur={photo}
            onChange={setPhoto}
            couleur={Colors.primary}
            fond={Colors.primaryBg}
            prenom={form.prenom}
            nom={form.nom}
          />

          <Text className="text-slate-700 font-bold mb-2 ml-1">Prénom</Text>
          <TextInput
            className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100"
            placeholder="Ex : Hery"
            value={form.prenom}
            onChangeText={(v) => setForm({ ...form, prenom: v })}
            autoCapitalize="words"
          />

          <Text className="text-slate-700 font-bold mb-2 ml-1">Nom</Text>
          <TextInput
            className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100"
            placeholder="Ex : Rakoto"
            value={form.nom}
            onChangeText={(v) => setForm({ ...form, nom: v })}
            autoCapitalize="words"
          />

          <SelecteurSexe valeur={sexe} onChange={setSexe} />

          <ChampDateNaissance valeur={naissance} onChange={setNaissance} />

          <Text className="text-slate-700 font-bold mb-2 ml-1">Adresse</Text>
          <TextInput
            className="bg-slate-50 p-4 rounded-2xl mb-1 border border-slate-100"
            placeholder="Ex : Lot II M 45 bis, Antananarivo"
            value={form.adresse}
            onChangeText={(v) => setForm({ ...form, adresse: v })}
            autoCapitalize="sentences"
          />
          <Text className="text-slate-400 text-xs ml-1 mb-4">
            Facultative — apparaît dans le dossier du patient
          </Text>

          <Text className="text-slate-700 font-bold mb-2 ml-1">Adresse Email</Text>
          <TextInput
            className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100"
            placeholder="patient@email.com"
            value={form.email}
            onChangeText={(v) => setForm({ ...form, email: v })}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text className="text-slate-700 font-bold mb-2 ml-1">Téléphone</Text>
          <TextInput
            className="bg-slate-50 p-4 rounded-2xl mb-1 border border-slate-100"
            placeholder="034 12 345 67"
            value={form.tel}
            onChangeText={(v) => setForm({ ...form, tel: v })}
            keyboardType="phone-pad"
          />
          <Text className="text-slate-400 text-xs ml-1 mb-4">Format Madagascar — 10 chiffres commençant par 0</Text>

          <View className="h-[1px] bg-slate-100 my-4" />

          <InfoIdentifiants couleur={Colors.patient} fond={Colors.patientBg} />

          <TouchableOpacity
            className="bg-emerald-600 p-5 rounded-2xl items-center shadow-lg shadow-emerald-200"
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">Créer le dossier</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity className="mt-6 items-center" onPress={() => router.back()}>
          <Text className="text-slate-400 font-medium">Annuler l'enregistrement</Text>
        </TouchableOpacity>

    </AppScrollView>
  );
}