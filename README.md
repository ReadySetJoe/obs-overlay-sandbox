# Stream Overlay System

A Next.js-based stream overlay system with real-time WebSocket communication for OBS.

## Features

- **Highlighted Chat Messages** - Role-based styling (viewer, subscriber, moderator, VIP, first-timer)
- **Audio-Reactive Particle System** - Particles respond to live audio with dynamic colors and intensity
- **Spotify Integration** - Auto-updating "Now Playing" widget with album art color extraction
- **Color Schemes** - 6 different mood-based color schemes
- **Weather Effects** - Rain, snow, and confetti animations
- **Scene Layers** - Toggle individual overlay components
- **Real-time Audio Analysis** - Particles react to music using Web Audio API

## Installation

1. Install the dependencies:

```bash
npm install
```

Required packages:
- `socket.io` and `socket.io-client` - Real-time communication
- `spotify-web-api-node` - Spotify API integration
- `colorthief` - Album art color extraction

2. Set up environment variables:

Create a `.env.local` file in your project root:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/spotify/callback
```

**Getting Spotify Credentials:**
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Copy your Client ID and Client Secret
4. Add `http://localhost:3000/api/spotify/callback` to your app's Redirect URIs

3. Project structure:

```
your-nextjs-app/
├── pages/
│   ├── api/
│   │   ├── socket.ts            # WebSocket server
│   │   └── spotify/
│   │       ├── login.ts         # Spotify OAuth login
│   │       ├── callback.ts      # OAuth callback handler
│   │       └── now-playing.ts   # Fetch current track
│   ├── overlay.tsx              # Overlay page for OBS
│   └── dashboard.tsx            # Control dashboard
├── components/
│   └── overlay/
│       ├── ChatMessage.tsx      # Chat message component
│       ├── ParticleSystem.tsx   # Audio-reactive particles
│       ├── WeatherEffect.tsx    # Weather effects
│       └── NowPlaying.tsx       # Spotify widget
├── hooks/
│   ├── useSocket.ts             # WebSocket hook
│   └── useAudioAnalyzer.ts      # Audio analysis hook
├── lib/
│   └── spotify.ts               # Spotify API setup
├── types/
│   └── overlay.ts               # TypeScript types
└── styles/
    └── globals.css              # Global styles with animations
```

4. Make sure your Next.js app has Tailwind CSS configured.

## Usage

### Dashboard

Navigate to `/dashboard` to control your overlay:

- **Spotify Integration**: Click "Connect Spotify" to link your account for auto-updating "Now Playing"
- **Chat Messages**: Send test chat messages with different roles and colors
- **Color Schemes**: Switch between 6 different mood-based themes
- **Weather Effects**: Toggle rain, snow, or confetti
- **Audio Levels**: Manual particle intensity control (when not using audio reactivity)
- **Scene Layers**: Toggle individual overlay components on/off

**Spotify Features:**
- Automatically updates track info every 5 seconds
- Shows current playing track with album art
- Progress bar syncs with playback
- Background colors extracted from album art
- Smooth animations on track changes
- Manual override still available

### Overlay

Navigate to `/overlay` to view the overlay (add as Browser Source in OBS):

- URL: `http://localhost:3000/overlay`
- Width: 1920
- Height: 1080
- FPS: 60
- Check "Shutdown source when not visible" for performance

**Audio Reactivity:**
Click "Enable Audio Reactive" on the overlay page to make particles respond to live audio. See the [Audio Setup](#audio-reactive-particles-setup) section below for configuring with headphones.

## OBS Setup

1. Add a **Browser Source** in OBS
2. Set the URL to your overlay page (e.g., `http://localhost:3000/overlay`)
3. Set dimensions to match your stream resolution
4. Set FPS to 60 for smooth animations
5. Check "Shutdown source when not visible"
6. Optional: Add custom CSS for chroma key if needed

## Customization

### Adding Custom Color Schemes

Edit `ParticleSystem.tsx` and `overlay-page.tsx`:

```typescript
const schemeColors: Record<string, string[]> = {
  // Add your custom scheme
  myScheme: ['#color1', '#color2', '#color3'],
};
```

### Adjusting Chat Message Duration

Edit `ChatMessage.tsx`:

```typescript
// Change the timeout value (in milliseconds)
const timer = setTimeout(() => {
  setIsLeaving(true);
  setTimeout(onComplete, 500);
}, 8000); // Currently 8 seconds
```

### Adding More Weather Effects

Edit `WeatherEffect.tsx` and add new drawing functions for custom effects.

## Audio-Reactive Particles Setup

The particle system can react to live audio in real-time! Here's how to set it up with headphones:

### macOS Setup (using BlackHole)

**1. Install BlackHole (Free Virtual Audio Driver)**
- Download from [BlackHole GitHub](https://github.com/ExistentialAudio/BlackHole)
- Install BlackHole 2ch `.pkg` file
- Restart your browser after installation

**2. Create a Multi-Output Device**
- Open **Audio MIDI Setup** app (⌘ + Space → "Audio MIDI Setup")
- Click the **"+"** button (bottom left) → **"Create Multi-Output Device"**
- Check both:
  - ✅ Your headphones (e.g., "MacBook Pro Speakers" or Bluetooth headphones)
  - ✅ BlackHole 2ch
- Right-click the Multi-Output Device → **"Use This Device For Sound Output"**

**3. Configure Spotify**
- In Spotify settings, set audio output to your new **Multi-Output Device**
- Now Spotify plays to both your headphones AND BlackHole

**4. Enable Audio Reactivity in Browser**
- Go to `/overlay` page
- Click **"Enable Audio Reactive"**
- In the browser permission dialog, select **BlackHole 2ch** as the microphone
- Grant permission

**5. Done!**
- Particles now react to your music in real-time
- You still hear everything through your headphones
- Audio level is displayed on screen

### Windows Setup (using VB-Audio Virtual Cable)

**1. Install VB-Audio Virtual Cable**
- Download from [VB-Audio website](https://vb-audio.com/Cable/)
- Install and restart your computer

**2. Set up Audio Routing**
- Right-click sound icon → **Sound settings**
- Set **Output device** to "CABLE Input"
- Set **Input device** to "CABLE Output"

**3. Configure Listen Back (to hear audio)**
- Open **Sound Control Panel** → **Recording** tab
- Right-click "CABLE Output" → **Properties**
- Go to **Listen** tab
- Check "Listen to this device"
- Select your headphones from dropdown
- Click **Apply**

**4. Enable in Browser**
- Follow step 4-5 from macOS instructions above
- Select "CABLE Output" when prompted for microphone access

## Integration with Real Services

### Twitch Chat Integration

You can integrate with Twitch using `tmi.js`:

```bash
npm install tmi.js
```

Create a new API route to listen to Twitch chat and emit to the overlay.

### Spotify Integration

✅ **Already integrated!** See the [Dashboard](#dashboard) section for setup instructions.

## Performance Tips

1. Limit the number of simultaneous particles (currently capped at 200)
2. Reduce canvas resolution for lower-end systems
3. Disable unused layers from the dashboard
4. Use hardware acceleration in OBS settings
5. Consider using a dedicated machine for streaming

## Troubleshooting

**WebSocket not connecting:**

- Ensure the Next.js dev server is running
- Check browser console for errors
- Verify the socket path matches in both client and server

**Overlay not visible in OBS:**

- Check if the URL is correct
- Ensure browser source dimensions match
- Try refreshing the browser source
- Check if "Shutdown source when not visible" is causing issues

**Performance issues:**

- Lower particle count
- Reduce weather effect density
- Disable unused layers
- Check OBS render lag in stats

## Features Overview

### ✅ Implemented
- Audio-reactive particle system with Web Audio API
- Spotify integration with OAuth authentication
- Dynamic album art color extraction
- Smooth progress bar sync
- Real-time WebSocket communication
- Multiple color schemes and weather effects
- Scene layer management

### 🚧 Future Enhancements
- Interactive games viewers can play via chat commands
- More weather effects (leaves, stars, bubbles)
- Animated GIF support for alerts
- Sound effect triggers
- Custom CSS theme editor
- Chat commands for viewers to trigger effects
- Leaderboards and statistics
- Twitch chat integration

## License

MIT License - Feel free to use and modify for your streams!
