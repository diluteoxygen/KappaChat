const fs = require('fs');
let code = fs.readFileSync('src/components/stream/StreamPage.tsx', 'utf-8');

// Replace specific known bad patterns
const replacements = [
  // Settings Header
  ['text-white/50', 'text-text-v4'],
  ['bg-white/5', 'bg-surface-muted'],
  ['text-white/40', 'text-text-v5'],
  ['hover:text-white', 'hover:text-text-v1'],
  
  // Connections Section
  ['text-white/30', 'text-text-v5'],
  ['border-white/10', 'border-border'],
  ['placeholder:text-white/25', 'placeholder:text-text-v5/50'],
  
  // Specific inputs
  ['text-sm text-white', 'text-sm text-text-v1'],
  ['hover:bg-white/10', 'hover:bg-surface-hover'],
  
  // Customization Sections
  ['bg-white/10 border-white/30 text-white', 'bg-accent/10 border-accent text-accent'],
  ['bg-white/5 border-transparent text-white/40 hover:bg-white/10', 'bg-surface-muted border-transparent text-text-v5 hover:bg-surface-hover'],
  ['ring-white/30', 'ring-accent/50'],
  ['border-white/20', 'border-border'],
  
  // Typography
  ['text-white/60', 'text-text-v4'],
  ['accent-white/60', 'accent-accent'],
  
  // Layout
  ['bg-white/10 text-white', 'bg-accent/10 text-accent'],
  ['bg-white/5 text-white/40 hover:bg-white/10', 'bg-surface-muted text-text-v5 hover:bg-surface-hover'],
  
  // Display
  ['bg-white/10 border-white/20 text-white', 'bg-accent/10 border-accent text-accent'],
  ['bg-white/40', 'bg-accent/50'],
  ['bg-white/10', 'bg-surface-muted'], // For the toggle background
  ['bg-white shadow-sm', 'bg-text-v1 shadow-sm'], // Toggle knob
  
  // Performance
  ['text-white/20', 'text-text-v5/50'],
  
  // Footer
  ['border-white/5', 'border-border'],
  
  // Minimal Header
  ['text-white tracking-tight', 'text-text-v1 tracking-tight'],
  ['text-white/60', 'text-text-v4'],
  ['border-white/5', 'border-border'],
  ['text-white/20', 'text-text-v5/50'],
  ['color: "rgba(255,255,255,0.5)"', 'color: "var(--color-text-v4)"'],
  ['color: "rgba(255,255,255,0.2)"', 'color: "var(--color-text-v5)"'],
  
  // Empty State
  ['text-white/80', 'text-text-v2'],
];

for (const [search, replace] of replacements) {
  // Global replace
  code = code.split(search).join(replace);
}

fs.writeFileSync('src/components/stream/StreamPage.tsx', code);
console.log('Fixed colors in StreamPage.tsx');
