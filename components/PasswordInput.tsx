import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = Omit<TextInputProps, 'secureTextEntry'> & {
  containerClassName?: string;
};

export function PasswordInput({ containerClassName, ...props }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <View
      className={
        containerClassName ??
        'bg-slate-50 rounded-2xl mb-4 border border-slate-200 flex-row items-center'
      }
    >
      <TextInput
        className="flex-1 p-4 text-slate-900"
        placeholderTextColor="#94a3b8"
        secureTextEntry={!visible}
        autoCapitalize="none"
        {...props}
      />
      <TouchableOpacity
        className="pr-4 pl-2 py-4"
        onPress={() => setVisible((v) => !v)}
        accessibilityLabel={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
      >
        <Ionicons
          name={visible ? 'eye-off' : 'eye'}
          size={22}
          color="#64748b"
        />
      </TouchableOpacity>
    </View>
  );
}
