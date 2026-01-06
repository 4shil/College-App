import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';

import { useThemeStore } from '../../store/themeStore';
import { withAlpha } from '../../theme/colorUtils';
import { Card } from './Card';
import { registerThemedAlertHandler, ThemedAlertButton, ThemedAlertOptions } from '../../lib/themedAlert';

function resolveActionColors(
  button: ThemedAlertButton,
  colors: any,
  isDark: boolean
): { bg: string; border: string; text: string } {
  if (button.style === 'destructive') {
    return {
      bg: withAlpha(colors.error, isDark ? 0.18 : 0.1),
      border: withAlpha(colors.error, 0.35),
      text: colors.error,
    };
  }

  if (button.style === 'cancel') {
    return {
      bg: withAlpha(colors.textPrimary, isDark ? 0.08 : 0.06),
      border: withAlpha(colors.textPrimary, isDark ? 0.14 : 0.12),
      text: colors.textPrimary,
    };
  }

  return {
    bg: withAlpha(colors.primary, isDark ? 0.18 : 0.1),
    border: withAlpha(colors.primary, 0.35),
    text: colors.primary,
  };
}

export function ThemedAlertProvider({ children }: { children: React.ReactNode }) {
  const { colors, isDark, animationsEnabled } = useThemeStore();

  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<ThemedAlertOptions | null>(null);

  const buttons = useMemo<ThemedAlertButton[]>(() => {
    if (!current?.buttons?.length) return [{ text: 'OK' }];
    return current.buttons;
  }, [current]);

  const cancelable = current?.cancelable ?? true;

  useEffect(() => {
    return registerThemedAlertHandler((opts) => {
      setCurrent(opts);
      setVisible(true);
    });
  }, []);

  const close = () => {
    setVisible(false);
    // Delay clearing content slightly to avoid flicker during fade.
    setTimeout(() => setCurrent(null), 120);
  };

  const handleBackdropPress = () => {
    if (!cancelable) return;

    const cancel = buttons.find((b) => b.style === 'cancel');
    close();
    cancel?.onPress?.();
  };

  const overlayScrim = withAlpha(colors.background, isDark ? 0.88 : 0.68);
  const backdropBlurIntensity = animationsEnabled ? (isDark ? 78 : 62) : (isDark ? 62 : 48);

  return (
    <>
      {children}
      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={handleBackdropPress}
      >
        <View style={styles.modalRoot}>
          <BlurView
            intensity={backdropBlurIntensity}
            tint="default"
            style={StyleSheet.absoluteFillObject}
          />
          <Pressable
            style={[styles.backdrop, { backgroundColor: overlayScrim }]}
            onPress={handleBackdropPress}
          />

          <View style={styles.centerWrap} pointerEvents="box-none">
            <Card
              animated={false}
              style={[
                styles.alertCard,
                {
                  borderRadius: colors.borderRadius * 2,
                },
              ]}
            >
              <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
                {current?.title || ''}
              </Text>
              {current?.message ? (
                <Text style={[styles.message, { color: colors.textSecondary }]}>{current.message}</Text>
              ) : null}

              <View style={[styles.actions, { borderTopColor: withAlpha(colors.textPrimary, isDark ? 0.12 : 0.08) }]}>
                {buttons.map((b, idx) => {
                  const actionColors = resolveActionColors(b, colors, isDark);
                  return (
                    <Pressable
                      key={`${b.text}-${idx}`}
                      onPress={() => {
                        close();
                        b.onPress?.();
                      }}
                      style={({ pressed }) => [
                        styles.actionBtn,
                        {
                          backgroundColor: actionColors.bg,
                          borderColor: actionColors.border,
                          borderRadius: colors.borderRadius,
                          opacity: pressed ? 0.9 : 1,
                        },
                      ]}
                    >
                      <Text style={[styles.actionText, { color: actionColors.text }]} numberOfLines={1}>
                        {b.text}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  centerWrap: {
    width: '100%',
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  alertCard: {
    width: '100%',
    maxWidth: 420,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
  },
  message: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  actions: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '900',
  },
});

export default ThemedAlertProvider;
