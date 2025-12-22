import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Card } from './Card';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  delay?: number;
  noPadding?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity,
  delay = 0,
  noPadding = false,
}) => {
  return (
    <Card
      intensity={intensity}
      delay={delay}
      noPadding={noPadding}
      style={style}
    >
      {children}
    </Card>
  );
};

export default GlassCard;
