// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      /**
       * Désactivée volontairement.
       *
       * La règle vient du web : dans du JSX destiné au navigateur, un `'`, un
       * `"` ou un `>` isolé dans du texte peut être le reste d'une balise mal
       * fermée, et l'écrire en entité prouve qu'il est voulu. React Native ne
       * parse aucun HTML — un caractère en trop dans un `<Text>` n'est que du
       * texte. Le risque couvert n'existe donc pas ici.
       *
       * Le coût, lui, est permanent : l'interface est en français, où presque
       * une phrase sur deux contient une apostrophe (« l'ordonnance »,
       * « n'a pas », « d'un »). La règle re-casserait le lint à chaque nouvel
       * écran, et `l&apos;enregistrement` se lit moins bien que
       * `l'enregistrement` dans le source.
       *
       * Un lint qui sort en erreur sur des faux positifs connus finit ignoré,
       * et la vraie erreur suivante passe inaperçue. Mieux vaut dire une fois
       * pourquoi cette règle ne s'applique pas au projet que la contourner
       * ligne à ligne avec des `eslint-disable`.
       */
      'react/no-unescaped-entities': 'off',
    },
  },
]);
