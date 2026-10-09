# OUTPOST — Cinematic Lunar Exploration Experience
### NASA Space Apps Challenge 2026

**OUTPOST** is a visually exceptional, cinematic, interactive web experience designed to make children and learners curious about lunar exploration, systems thinking, resource management, and the cascading consequences of decisions.

---

## 🌟 Key Features

1. **Art-Directed 3D Lunar Environment**
   - Believable, cratered lunar surface with realistic elevation undulations, regolith bump mapping, scattered boulders, rover tracks, and distant mountain ridges.
   - Deep-black space environment with twinkling star fields and an orbital view of Earth featuring rotating clouds and atmospheric rim glow.
   - Genuine 3D models (CC0 / CC-BY / NASA):
     - Articulated dual-axis **Solar Arrays** with live photovoltaic indicators.
     - Pressurized **Crew Habitat Dome** with practical interior lighting.
     - Transparent **Lunar Biodome Greenhouse** with bioluminescent hydroponic crops.
     - **Battery Storage Bank** with real-time charge bars.
     - **Science Laboratory** with spectrometer laser core analysis.
     - **Deep Space Communication Antenna** oriented towards Earth.
     - Autonomous **Lunar Exploration Rover** and astronauts on EVA.
     - Animated pulsing **Energy Conduits** linking solar generation to storage and modules.

2. **ORBIT AI Mission Companion**
   - In-world physical robot drone that hovers, rotates, tilts toward the camera, and flies directly to failing subsystems to alert the player.
   - Expressive holographic eye reacting with colors (Cyan for Nominal, Amber for Calculating, Red for Crisis, Emerald for Victory).
   - Concise contextual speech bubbles and voice narration support.

3. **Deterministic Multi-System Simulation**
   - Preserves and executes real resource relationships: Electrical Power (kW / %), Battery Storage (%), Water reserves (%), Food crops (%), Oxygen (%), Crew Health (%), and Science Discoveries (pts).
   - Fully deterministic math with verifiable causal chains.

4. **Signature Feature: The Future Fork**
   - When a critical event strikes (such as mountain shadows plunging the solar array into darkness), time pauses into the **Future Fork**.
   - Players can seamlessly **preview 3 distinct futures directly in the 3D world** before committing:
     1. *Keep Science Running*: Full laser extraction, but severe battery drain into danger zones.
     2. *Save Power (Reduce Science)*: Pauses heavy lasers to stabilize the battery bank with safe margins.
     3. *Activate Emergency Mode*: Outpost enters low-power standby for a 48-hour survival buffer.
   - Interactive trajectory sparklines and simulated deltas guide systems thinking.

5. **Living World Consequences**
   - Committing a strategy dynamically updates the 3D environment: lighting shifts, laser state alters, metrics count, and ORBIT reacts.
   - Delivers the core educational lesson in a single, memorable sentence.
   - Includes full "Rewind Strategy" and root cause analysis capabilities.

6. **Immersive Audio & Game Feel**
   - Atmospheric space exploration soundtrack ("Reloj en el Vacío").
   - Crisis emergency tension soundtrack ("Red Alert Corridor").
   - Full Web Audio synthesizer for tactile holographic beeps, focus sweeps, and success chimes.
   - Instant mute/unmute toggle and browser autoplay policy compliance.

---

## 🚀 Running the Experience Locally

### Prerequisites
- Node.js (v18+)
- Modern browser (Chrome, Edge, Firefox, Safari)

### Quick Start
```bash
# Navigate to the project directory
cd C:\Users\user\.gemini\antigravity\scratch\outpost

# Install dependencies (already installed)
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) in your web browser.

### Building for Production
```bash
npm run build
npm run preview
```

---

## 📜 Asset Credits & Licenses
See [CREDITS.md](CREDITS.md) for full licensing details, creator attributions, and public repository links.
