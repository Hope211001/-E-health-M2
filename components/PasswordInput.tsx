import React, { useState } from 'react';
import {
  View, TextInput, TouchableOpacity, TextInputProps,
  StyleSheet, StyleProp, ViewStyle, TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';

type Props = Omit<TextInputProps, 'secureTextEntry'> & {
  /** Classe NativeWind du conteneur (écrans en NativeWind). Si absente/vide,
   *  on retombe sur le style StyleSheet par défaut ci-dessous. */
  containerClassName?: string;
  /** Surcharge StyleSheet du conteneur (écrans en StyleSheet). */
  containerStyle?: StyleProp<ViewStyle>;
  /** Surcharge StyleSheet du champ de saisie. */
  inputStyle?: StyleProp<TextStyle>;
};

export function PasswordInput({
  containerClassName, containerStyle, inputStyle, ...props
}: Props) {
  const [visible, setVisible] = useState(false);

  // Une chaîne vide ("") est falsy → on applique le style StyleSheet par défaut,
  // ce qui corrige les écrans qui passaient containerClassName="".
  const useDefaultStyle = !containerClassName;

  return (
    <View
      className={containerClassName || undefined}
      style={[useDefaultStyle && styles.container, containerStyle]}
    >
      <TextInput
        style={[styles.input, inputStyle]}
        placeholderTextColor={Colors.textMuted}
        secureTextEntry={!visible}
        autoCapitalize="none"
        cursorColor={Colors.primary}
        selectionColor={Colors.primary}
        {...props}
      />
      <TouchableOpacity
        style={styles.eyeBtn}
        onPress={() => setVisible((v) => !v)}
        accessibilityLabel={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
      >
        <Ionicons
          name={visible ? 'eye-off' : 'eye'}
          size={22}
          color={Colors.textMuted}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  input: {
    flex: 1,
    padding: 14,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  eyeBtn: {
    paddingRight: 14,
    paddingLeft: 8,
    paddingVertical: 14,
  },
});
