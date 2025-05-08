// Cyberpunk Theme Configuration
export const cyberpunkTheme = {
  // Core colors
  primary: {
    main: 'rgb(0, 255, 255)', // Cyan
    light: 'rgba(0, 255, 255, 0.7)',
    dark: 'rgba(0, 200, 200, 1)',
    glow: '0 0 10px rgba(0, 255, 255, 0.7), 0 0 20px rgba(0, 255, 255, 0.3) inset',
  },
  secondary: {
    main: 'rgb(255, 69, 0)', // Orange-red
    light: 'rgba(255, 69, 0, 0.7)',
    dark: 'rgba(220, 60, 0, 1)',
    glow: '0 0 10px rgba(255, 69, 0, 0.7), 0 0 20px rgba(255, 69, 0, 0.3) inset',
  },
  accent: {
    main: 'rgb(255, 213, 0)', // Yellow
    light: 'rgba(255, 213, 0, 0.7)',
    dark: 'rgba(220, 180, 0, 1)',
    glow: '0 0 10px rgba(255, 213, 0, 0.7), 0 0 20px rgba(255, 213, 0, 0.3) inset',
  },
  
  // Background colors
  background: {
    main: 'rgb(10, 15, 30)', // Dark blue-gray
    light: 'rgb(30, 35, 50)',
    dark: 'rgb(0, 5, 15)',
    paper: 'rgb(20, 25, 40)',
  },
  
  // Text colors
  text: {
    primary: 'rgb(220, 220, 255)', // Light blue-white
    secondary: 'rgb(160, 160, 200)',
    disabled: 'rgb(100, 100, 130)',
    highlight: 'rgb(0, 255, 255)', // Cyan
    warning: 'rgb(255, 213, 0)', // Yellow
    error: 'rgb(255, 69, 0)', // Orange-red
  },
  
  // Border styling
  border: {
    width: '2px',
    style: 'solid',
    radius: '4px',
    glow: '0 0 5px',
  },
  
  // Typography
  typography: {
    fontFamily: '"Rajdhani", "Orbitron", "Roboto Mono", monospace',
    titleFontFamily: '"Orbitron", "Rajdhani", "Roboto Mono", monospace',
    monospace: '"Roboto Mono", monospace',
  },
  
  // Animation
  animation: {
    glitch: 'glitch 1s infinite',
    pulse: 'pulse 2s infinite',
    scan: 'scan 2s linear infinite',
    flicker: 'flicker 0.3s infinite',
  },
  
  // Effects
  effects: {
    noise: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.1\'/%3E%3C/svg%3E")',
    scanline: 'linear-gradient(to bottom, rgba(0, 255, 255, 0) 0%, rgba(0, 255, 255, 0.03) 50%, rgba(0, 255, 255, 0) 100%)',
  },
  
  // Utility classes
  classes: {
    glowBox: 'border-2 border-cyan-500 bg-gray-900 rounded-md shadow-lg',
    glowText: 'text-cyan-400 font-medium tracking-wide',
    scanlines: 'relative after:content-[""] after:absolute after:inset-0 after:bg-repeat after:pointer-events-none',
    glitchText: 'animate-glitch text-cyan-400 font-bold',
    terminal: 'font-mono text-green-400 bg-black p-4 border border-green-500',
  },
};

// CSS animations
export const cyberpunkAnimations = `
@keyframes glitch {
  0% {
    transform: translate(0);
  }
  20% {
    transform: translate(-2px, 2px);
  }
  40% {
    transform: translate(-2px, -2px);
  }
  60% {
    transform: translate(2px, 2px);
  }
  80% {
    transform: translate(2px, -2px);
  }
  100% {
    transform: translate(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

@keyframes scan {
  0% {
    background-position: 0 -100vh;
  }
  100% {
    background-position: 0 100vh;
  }
}

@keyframes flicker {
  0% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.8;
  }
}
`;

// Helper function to create css string with cyberpunk styles
export function createCyberpunkStyles() {
  return `
    ${cyberpunkAnimations}
    
    .cyberpunk-bg {
      background-color: ${cyberpunkTheme.background.main};
      background-image: ${cyberpunkTheme.effects.noise};
      position: relative;
    }
    
    .cyberpunk-bg::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: ${cyberpunkTheme.effects.scanline};
      background-size: 100% 4px;
      animation: scan 2s linear infinite;
      pointer-events: none;
      z-index: 1;
    }
    
    .cyberpunk-panel {
      border: ${cyberpunkTheme.border.width} solid ${cyberpunkTheme.primary.main};
      border-radius: ${cyberpunkTheme.border.radius};
      background-color: ${cyberpunkTheme.background.paper};
      box-shadow: ${cyberpunkTheme.primary.glow};
      overflow: hidden;
      position: relative;
    }
    
    .cyberpunk-terminal {
      font-family: ${cyberpunkTheme.typography.monospace};
      color: ${cyberpunkTheme.primary.main};
      background-color: rgba(0, 0, 0, 0.7);
      padding: 1rem;
      border-radius: 4px;
      position: relative;
    }
    
    .cyberpunk-text {
      font-family: ${cyberpunkTheme.typography.fontFamily};
      color: ${cyberpunkTheme.text.primary};
      text-shadow: 0 0 5px ${cyberpunkTheme.primary.light};
    }
    
    .cyberpunk-title {
      font-family: ${cyberpunkTheme.typography.titleFontFamily};
      color: ${cyberpunkTheme.primary.main};
      text-transform: uppercase;
      letter-spacing: 2px;
      text-shadow: 0 0 10px ${cyberpunkTheme.primary.light};
    }
    
    .cyberpunk-button {
      background-color: rgba(0, 0, 0, 0.6);
      border: 1px solid ${cyberpunkTheme.primary.main};
      color: ${cyberpunkTheme.primary.main};
      text-transform: uppercase;
      font-family: ${cyberpunkTheme.typography.fontFamily};
      padding: 0.5rem 1rem;
      position: relative;
      transition: all 0.3s ease;
      overflow: hidden;
    }
    
    .cyberpunk-button:hover {
      background-color: rgba(0, 255, 255, 0.1);
      box-shadow: 0 0 10px ${cyberpunkTheme.primary.main};
    }
    
    .cyberpunk-button::after {
      content: "";
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        to right,
        transparent 0%,
        rgba(0, 255, 255, 0.2) 50%,
        transparent 100%
      );
      transition: left 0.3s ease;
    }
    
    .cyberpunk-button:hover::after {
      left: 100%;
    }
    
    .cyberpunk-input {
      background-color: rgba(0, 0, 0, 0.6);
      border: 1px solid ${cyberpunkTheme.primary.main};
      color: ${cyberpunkTheme.text.primary};
      font-family: ${cyberpunkTheme.typography.monospace};
      padding: 0.5rem;
      outline: none;
    }
    
    .cyberpunk-input:focus {
      box-shadow: 0 0 10px ${cyberpunkTheme.primary.main};
    }
    
    .cyberpunk-table {
      border-collapse: separate;
      border-spacing: 0;
      width: 100%;
    }
    
    .cyberpunk-table th {
      background-color: rgba(0, 255, 255, 0.1);
      color: ${cyberpunkTheme.primary.main};
      text-transform: uppercase;
      font-weight: bold;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid ${cyberpunkTheme.primary.main};
    }
    
    .cyberpunk-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid rgba(0, 255, 255, 0.3);
    }
    
    .cyberpunk-table tr:hover td {
      background-color: rgba(0, 255, 255, 0.05);
    }
  `;
} 