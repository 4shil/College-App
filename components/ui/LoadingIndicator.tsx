import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { TriangleLoader } from './TriangleLoader';

export type LoadingIndicatorSize = 'small' | 'large' | number;

export type LoadingIndicatorProps = {
  size?: LoadingIndicatorSize;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

function toPx(size: LoadingIndicatorSize | undefined) {
  if (typeof size === 'number') return size;
  if (size === 'small') return 16;
  if (size === 'large') return 50;
  return 24;
}

export function LoadingIndicator({ size, color, style }: LoadingIndicatorProps) {
  const px = toPx(size);

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <TriangleLoader size={px} color={color} />
    </View>
  );
}
