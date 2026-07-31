# Son de l'alarme des rappels de médicaments

Dépose ici un fichier **`alarme.wav`** (c'est le son joué quand un rappel se déclenche).

## Contraintes
- **Nom exact** : `alarme.wav` (référencé dans `app.json` → plugin `expo-notifications` → `sounds`).
- **Format** : `.wav` (compatible Android **et** iOS).
- **Durée** : ~10 à 30 s (Android joue le fichier en entier ; iOS coupe à 30 s max).
- **Taille** : garde-le léger (< 1 Mo idéalement).

## Où trouver un son libre de droits
- https://pixabay.com/sound-effects/search/alarm/  (télécharge en MP3 puis convertis en WAV)
- https://mixkit.co/free-sound-effects/alarm/
- Convertisseur en ligne MP3 → WAV : https://cloudconvert.com/mp3-to-wav

## ⚠️ Important
Tant que `alarme.wav` n'est **pas** dans ce dossier, `eas build` **échouera**
(l'asset référencé dans `app.json` est introuvable). Ajoute le fichier **avant**
de lancer le build.

Si tu veux revenir au son court du système en attendant :
- `api/notificationLocal.ts` → `const ALARM_SOUND = 'default';`
- `app.json` → retire la ligne `"sounds": [...]`
