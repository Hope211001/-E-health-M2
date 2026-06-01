import React, { useEffect, useRef } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  TextInput,
} from 'react-native';

/**
 * AppScrollView — scroll « clavier-aware » 100 % React Native natif.
 *
 * On n'utilise PAS react-native-keyboard-controller (module natif qui, sous la
 * nouvelle architecture, intercepte les touches et casse la saisie). À la
 * place :
 *  - KeyboardAvoidingView (behavior 'padding') dégage la place sous le clavier
 *    — nécessaire car l'app est en edgeToEdge, donc Android ne redimensionne
 *    plus l'écran tout seul ;
 *  - à l'ouverture du clavier, si le champ focus est masqué par le clavier, on
 *    fait défiler le ScrollView juste ce qu'il faut pour le rendre visible.
 *
 * On utilise `measure()` (coordonnées écran, compatible Fabric) et NON
 * `measureLayout(findNodeHandle(...))` qui plante sur la nouvelle archi
 * (« ref.measureLayout must be called with a ref to a native component »).
 */
type AppScrollViewProps = ScrollViewProps & {
  /** Marge bas ajoutée sous le contenu (pour dégager le clavier) */
  bottomOffset?: number;
  children?: React.ReactNode;
};

export function AppScrollView({
  bottomOffset = 0,
  contentContainerStyle,
  onScroll,
  ...props
}: AppScrollViewProps) {
  const scrollRef = useRef<ScrollView>(null);
  const offsetY = useRef(0);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offsetY.current = e.nativeEvent.contentOffset.y;
    onScroll?.(e);
  };

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', (e) => {
      const focused = TextInput.State.currentlyFocusedInput?.();
      const scroll = scrollRef.current;
      if (!focused || !scroll) return;

      const keyboardTop = e.endCoordinates.screenY;
      const margin = 24;

      (focused as any).measure?.(
        (_x: number, _y: number, _w: number, h: number, _px: number, py: number) => {
          const fieldBottom = py + h;
          // Le champ dépasse sous le clavier → on défile de la différence.
          if (fieldBottom > keyboardTop - margin) {
            const delta = fieldBottom - (keyboardTop - margin);
            scroll.scrollTo({ y: offsetY.current + delta, animated: true });
          }
        },
      );
    });
    return () => sub.remove();
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior="padding"
    >
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={handleScroll}
        contentContainerStyle={[
          contentContainerStyle,
          bottomOffset ? { paddingBottom: bottomOffset } : null,
        ]}
        {...props}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
