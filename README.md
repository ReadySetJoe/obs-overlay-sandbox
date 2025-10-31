# Stream Overlay System

A Next.js-based stream overlay system with real-time WebSocket communication for OBS.

## Features

- **Highlighted Chat Messages** - Role-based styling (viewer, subscriber, moderator, VIP, first-timer)
- **Spotify Integration** - Auto-updating "Now Playing" widget with album art color extraction
- **Color Schemes** - 6 different mood-based color schemes
- **Weather Effects** - Rain, snow, and confetti animations
- **Scene Layers** - Toggle individual overlay components
- **User Authentication** - Sign in with Twitch to save your overlay settings

## Installation

1. Install the dependencies:

```bash
npm install
```

Required packages:

- `socket.io` and `socket.io-client` - Real-time communication
- `spotify-web-api-node` - Spotify API integration
- `colorthief` - Album art color extraction
- `next-auth` - Authentication with Twitch
- `@prisma/client` - Database ORM

2. Set up environment variables:

Create a `.env.local` file in your project root:

```env
# Database
DATABASE_URL="postgresql://obs_user:obs_password@localhost:5432/obs_overlay"

# Spotify OAuth
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/spotify/callback

# NextAuth
NEXTAUTH_URL=http://localhost:3000/
NEXTAUTH_SECRET=your-secret-key-change-this-in-production

# Twitch OAuth
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
```

**Getting Spotify Credentials:**

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Copy your Client ID and Client Secret
4. Add `http://localhost:3000/api/spotify/callback` to your app's Redirect URIs

**Getting Twitch Credentials:**

1. Go to [Twitch Developer Console](https://dev.twitch.tv/console/apps)
2. Create a new application
3. Copy your Client ID and Client Secret
4. Add `http://localhost:3000/api/auth/callback/twitch` to your OAuth Redirect URLs

5. Set up the database:

```bash
# Start PostgreSQL with Docker
docker-compose up -d

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate
```

4. Project structure:

```
your-nextjs-app/
├── pages/
│   ├── api/
│   │   ├── socket.ts            # WebSocket server
│   │   ├── auth/                # NextAuth configuration
│   │   ├── layouts/             # Layout save/load endpoints
│   │   └── spotify/             # Spotify OAuth and API
│   ├── overlay/[sessionId].tsx  # Overlay page for OBS
│   ├── dashboard/[sessionId].tsx # Control dashboard
│   └── index.tsx                # Landing page
├── components/
│   └── overlay/
│       ├── ChatMessage.tsx      # Chat message component
│       ├── WeatherEffect.tsx    # Weather effects
│       └── NowPlaying.tsx       # Spotify widget
├── hooks/
│   └── useSocket.ts             # WebSocket hook
├── lib/
│   ├── spotify.ts               # Spotify API setup
│   └── prisma.ts                # Prisma client
├── prisma/
│   └── schema.prisma            # Database schema
└── types/
    └── overlay.ts               # TypeScript types
```

## Usage

### Getting Started

1. Start the development server:

```bash
npm run dev
```

2. Navigate to `http://localhost:3000`
3. Sign in with your Twitch account to create a session
4. You'll be redirected to your dashboard with a unique session ID

### Dashboard

Navigate to `/dashboard/[your-session-id]` to control your overlay:

- **Spotify Integration**: Click "Connect Spotify" to link your account for auto-updating "Now Playing"
- **Color Schemes**: Switch between 6 different mood-based themes
- **Weather Effects**: Toggle rain, snow, or confetti
- **Scene Layers**: Toggle individual overlay components on/off
- **Auto-Save**: Your settings are automatically saved when signed in with Twitch

**Spotify Features:**

- Automatically updates track info every 5 seconds
- Shows current playing track with album art
- Progress bar syncs with playback
- Background colors extracted from album art
- Smooth animations on track changes
- Manual override still available

### Overlay

Navigate to `/overlay/[your-session-id]` to view the overlay (add as Browser Source in OBS):

- URL: `http://localhost:3000/overlay/[your-session-id]`
- Width: 1920
- Height: 1080
- FPS: 60
- Check "Shutdown source when not visible" for performance

## OBS Setup

1. Add a **Browser Source** in OBS
2. Set the URL to your overlay page (e.g., `http://localhost:3000/overlay/abc123`)
3. Set dimensions to 1920x1080
4. Set FPS to 60 for smooth animations
5. Check "Shutdown source when not visible"

## Customization

### Adding Custom Color Schemes

Edit the color scheme styles in `overlay/[sessionId].tsx`:

```typescript
const colorSchemeStyles: Record<ColorScheme, string> = {
  default: 'from-blue-900/20 to-purple-900/20',
  gaming: 'from-red-900/20 to-orange-900/20',
  // Add your custom scheme
  myScheme: 'from-color1-900/20 to-color2-900/20',
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

## Database Management

The project uses PostgreSQL with Prisma ORM. Useful commands:

```bash
# Open Prisma Studio (database GUI)
npm run db:studio

# Reset database (WARNING: deletes all data)
npm run db:reset

# Push schema changes without migrations
npm run db:push
```

## Integration with Real Services

### Twitch Chat Integration

You can integrate with Twitch using `tmi.js`:

```bash
npm install tmi.js
```

Create a new API route to listen to Twitch chat and emit to the overlay.

### Spotify Integration

Already integrated! See the [Dashboard](#dashboard) section for setup instructions.

## Performance Tips

1. Reduce canvas resolution for lower-end systems
2. Disable unused layers from the dashboard
3. Use hardware acceleration in OBS settings
4. Consider using a dedicated machine for streaming
5. Keep the dashboard tab visible if using Spotify integration

## Troubleshooting

**WebSocket not connecting:**

- Ensure the Next.js dev server is running
- Check browser console for errors
- Verify the socket path matches in both client and server

**Overlay not visible in OBS:**

- Check if the URL is correct and includes your session ID
- Ensure browser source dimensions match (1920x1080)
- Try refreshing the browser source
- Check if "Shutdown source when not visible" is causing issues

**Spotify not updating:**

- Make sure you're signed into Spotify and playing music
- Check that you've granted permission in the Spotify dashboard
- Try disconnecting and reconnecting Spotify in the dashboard
- Check browser console for token refresh errors

**Database connection issues:**

- Make sure PostgreSQL is running: `docker-compose ps`
- Check that DATABASE_URL in .env matches docker-compose.yml
- Try restarting the database: `docker-compose restart`

## Features Overview

### Implemented

- Real-time WebSocket communication
- Spotify integration with OAuth authentication
- Dynamic album art color extraction
- Smooth progress bar sync
- Multiple color schemes and weather effects
- Scene layer management
- User authentication with Twitch
- Database persistence of user settings

### Future Enhancements

- Twitch chat integration
- Interactive games viewers can play via chat commands
- More weather effects (leaves, stars, bubbles)
- Animated GIF support for alerts
- Sound effect triggers
- Custom CSS theme editor
- Chat commands for viewers to trigger effects
- Leaderboards and statistics

## License

MIT License - Feel free to use and modify for your streams!
