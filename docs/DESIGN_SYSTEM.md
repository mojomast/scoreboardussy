# 🎨 Design System Guide

## Overview

Your improv scoreboard now has a **modular design system** with multiple design variants for each UI element. You can mix and match designs to create your perfect show setup!

## 🎯 Quick Start

1. **Start the app**:
   ```bash
   cd client && npm run dev
   ```

2. **Open any page** (display, control, or vote)

3. **Click the gear icon** (bottom-right corner) to open the Design Picker

4. **Select your favorite** design for each element

5. **Your choices are saved** automatically to localStorage

## 🎨 Available Designs

### Scoreboard Display (What the audience sees)
- **Cyberpunk** - Neon glow, particle effects, futuristic grid background
- **Minimalist** - Clean ESPN-like broadcast style, professional and elegant  
- **Retro** - 8-bit arcade aesthetic, CRT scanlines, pixel art

### Control Panel (Referee backstage)
- **Dark Professional** - VS Code-like dark theme, keyboard shortcuts, dense info
- **Touch Friendly** - Big iPad-optimized buttons, swipe gestures, clean layout
- **Gamepad** - Xbox/PlayStation controller layout, fun ABXY buttons

### Voting Interface (Audience phones)
- **Social** - TikTok/Instagram energy, vertical tap areas, heart animations
- **Casino** - Vegas glitz, slot machine counters, gold coins, neon glow
- **Minimal** - Apple-esque elegance, subtle animations, refined typography

## 🔧 How It Works

The system uses React Context (`DesignContext`) to track which variant is selected for each element:

```typescript
type DesignConfig = {
  scoreboard: 'cyberpunk' | 'minimalist' | 'retro';
  controlPanel: 'dark' | 'touch' | 'gamepad';
  voting: 'social' | 'casino' | 'minimal';
};
```

Router components read from this context and render the appropriate variant:
- `ScoreboardDisplayRouter` → renders selected scoreboard design
- `ControlPanelRouter` → renders selected control panel design  
- `VotingInterfaceRouter` → renders selected voting design

## 🎪 Recommended Combinations for Your Next Show

### "High-Tech Show"
- Scoreboard: Cyberpunk
- Control: Dark Professional
- Voting: Social

### "Classic Sports"
- Scoreboard: Minimalist
- Control: Touch Friendly
- Voting: Minimal

### "Retro Game Night"
- Scoreboard: Retro
- Control: Gamepad
- Voting: Casino

## 🛠️ Adding New Designs

Want to create your own variant?

1. Create a new component in the appropriate `variants/` directory
2. Follow the same props interface as existing variants
3. Add it to the variants/index.ts barrel export
4. Update the router component to include your new variant
5. Update DesignContext types if needed

## 📁 File Structure

```
client/src/
├── contexts/
│   └── DesignContext.tsx          # Design configuration state
├── components/
│   ├── scoreboard/
│   │   ├── ScoreboardDisplayRouter.tsx  # Routes to selected variant
│   │   └── variants/
│   │       ├── CyberpunkScoreboard.tsx
│   │       ├── MinimalistScoreboard.tsx
│   │       └── RetroScoreboard.tsx
│   ├── control/
│   │   ├── ControlPanelRouter.tsx
│   │   └── variants/
│   │       ├── DarkControlPanel.tsx
│   │       ├── TouchControlPanel.tsx
│   │       └── GamepadControlPanel.tsx
│   ├── voting/
│   │   ├── VotingInterfaceRouter.tsx
│   │   └── variants/
│   │       ├── SocialVoting.tsx
│   │       ├── CasinoVoting.tsx
│   │       └── MinimalVoting.tsx
│   └── ui/
│       └── DesignPicker.tsx       # Floating design selector
```

## 💡 Tips for Your Show

1. **Test all combinations** before show night in the arena at http://localhost:5173
2. **Pick one design per element** - mixing themes across elements creates unique vibes
3. **The audience display matters most** - that's what people remember!
4. **Control panel should be fast** - pick whichever lets you operate quickest
5. **Voting should be fun** - audience engagement is key

## 🚀 Arena Demos

View all competitors side-by-side at:
- http://100.72.41.9:8765/arena (Tailscale)
- http://localhost:8765/arena (Local)

---

Made with love for improv! 🎭
