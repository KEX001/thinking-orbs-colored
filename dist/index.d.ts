import React from 'react';

export type ThinkingOrbState = 'working' | 'searching' | 'solving' | 'listening' | 'composing' | 'shaping';
export type ThinkingOrbSize = 64 | 20;
export type ThinkingOrbTheme = 'auto' | 'dark' | 'light';

export interface ThinkingOrbProps extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
  state?: ThinkingOrbState;
  size?: ThinkingOrbSize;
  color?: string;
  theme?: ThinkingOrbTheme;
  speed?: number;
  paused?: boolean;
}

export const ThinkingOrb: React.FC<ThinkingOrbProps>;

declare global {
  interface Window {
    renderThinkingOrb: (
      containerId: string,
      state?: ThinkingOrbState,
      size?: ThinkingOrbSize,
      theme?: ThinkingOrbTheme,
      color?: string
    ) => void;
  }
}
