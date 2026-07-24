import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThinkingOrb } from 'thinking-orbs';

const roots = new Map();

window.renderThinkingOrb = (containerId, state = 'working', size = 64, theme = 'dark', color = 'purple') => {
  const container = document.getElementById(containerId);
  if (container) {
    let root = roots.get(containerId);
    if (!root) {
      root = createRoot(container);
      roots.set(containerId, root);
    }
    root.render(React.createElement(ThinkingOrb, { state, size, theme, color }));
  }
};

export { ThinkingOrb };
