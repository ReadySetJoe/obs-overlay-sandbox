# Stream Overlay System

A Next.js-based stream overlay system with real-time WebSocket communication for OBS. Create and customize professional stream overlays with live Twitch chat integration, Spotify "Now Playing" displays, countdown timers, weather effects, and more.

## Quick Start

```bash
# Clone and install
git clone <repository-url>
cd obs-overlay-sandbox
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Start database
docker-compose up -d

# Initialize database
npm run db:generate
npm run db:migrate

# Run development server
npm run dev
```

Visit `http://localhost:3000`, sign in with Twitch, and start customizing your overlays!

> **New to this project?** See [Installation](#installation) for detailed setup instructions.

## Features

### 🎨 Overlay Components

- **Chat Highlight System** - Display and highlight Twitch chat messages in real-time
  - Live Twitch chat monitoring via tmi.js
  - Role-based styling (viewer, subscriber, moderator, VIP, first-timer)
  - Search and filter messages
  - Click to highlight individual messages
  - Configurable position, size, and scale

- **Spotify "Now Playing"** - Auto-updating music widget
  - OAuth integration with Spotify
  - Album art with dynamic color extraction
  - Real-time progress bar sync
  - Automatic track updates every 5 seconds
  - Smooth animations on track changes
  - Configurable position and size

- **Countdown Timers** - Multiple configurable timers
  - Create unlimited timers per session
  - Set title, description, and target date/time
    - Real-time countdown display (days, hours, minutes, seconds)
  - Confetti animation when timer reaches zero
  - Toggle active/inactive state
  - Database persistence

- **Emote Wall** - Animated floating emotes
  - Canvas-based particle system
  - Configurable emote (emoji), count, speed, and scale
  - Physics-based animation
  - Trigger on-demand from dashboard

- **Weather Effects** - Atmospheric overlays
  - Rain, snow, fog, or none
  - Adjustable particle density
  - Canvas-based rendering for smooth performance

- **Color Schemes & Theming** - 18 professionally designed themes + custom colors
  - **Gaming**: Cyberpunk, Retro Arcade, FPS Modern
  - **Chill**: Sunset, Ocean, Forest, Lavender
  - **Vibrant**: Synthwave, Vaporwave, Rainbow, Neon, Candy
  - **Minimal**: Dark, Monochrome, Pastel, Noir
  - **Custom Builder**: Create your own with custom primary/secondary/accent colors
  - **Intelligent Contrast**: Automatic text color adjustment for readability on all themes
  - **Themed Components**: Countdown timers, chat highlights, and paint by numbers adapt to your chosen theme
  - Real-time theme switching across all overlays

### 🎛️ Dashboard Features

- **Twitch Authentication** - Sign in to save and manage your overlays
- **Session Management** - Unique session IDs for each layout
- **Component Positioning** - Visual controls for x/y coordinates, width, and scale
- **Auto-Save** - Settings automatically saved to database
- **Real-time Preview** - See changes instantly via WebSockets
- **OBS URL Generator** - Copy-paste URLs for each overlay component
- **Spotify Connection** - One-click OAuth integration
- **Twitch Chat Connection** - Connect to your channel's live chat

## Installation

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd obs-overlay-sandbox
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials. The required variables are:

```env
# Database (Required)
DATABASE_URL="postgresql://user:password@localhost:5432/obs_overlay"

# NextAuth (Required)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"  # Generate with: openssl rand -base64 32

# Twitch OAuth (Required)
TWITCH_CLIENT_ID="your-twitch-client-id"
TWITCH_CLIENT_SECRET="your-twitch-client-secret"

# Spotify OAuth (Optional - for Now Playing feature)
SPOTIFY_CLIENT_ID="your-spotify-client-id"
SPOTIFY_CLIENT_SECRET="your-spotify-client-secret"
SPOTIFY_REDIRECT_URI="http://localhost:3000/api/spotify/callback"
```

**🔐 Generate a Secure Secret:**

```bash
openssl rand -base64 32
```

Copy the output and use it as your `NEXTAUTH_SECRET`.

**🎮 Getting Twitch Credentials:**

1. Go to [Twitch Developer Console](https://dev.twitch.tv/console/apps)
2. Click "Register Your Application"
3. Set OAuth Redirect URL to: `http://localhost:3000/api/auth/callback/twitch`
4. Copy your Client ID and generate a Client Secret

**🎵 Getting Spotify Credentials (Optional):**

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Copy your Client ID and Client Secret
4. Add Redirect URI: `http://localhost:3000/api/spotify/callback`

> **Note:** The app validates required environment variables on startup. If any are missing, you'll see a clear error message.

### 3. Set Up the Database

```bash
# Start PostgreSQL with Docker
docker-compose up -d

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate
```

### 4. Start the Development Server

```bash
npm run dev
```

Navigate to `http://localhost:3000` and sign in with your Twitch account!

## Project Structure

```
obs-overlay-sandbox/
├── pages/
│   ├── api/
│   │   ├── socket.ts                # WebSocket server initialization
│   │   ├── auth/[...nextauth].ts    # NextAuth configuration
│   │   ├── layouts/                 # Layout CRUD endpoints
│   │   ├── spotify/                 # Spotify OAuth and Now Playing API
│   │   ├── timers/                  # Countdown timer CRUD
│   │   └── twitch/                  # Twitch chat connect/disconnect
│   ├── dashboard/[sessionId].tsx    # Main control dashboard
│   ├── overlay/
│   │   ├── [sessionId].tsx          # Combined overlay (all components)
│   │   └── [sessionId]/             # Individual overlay pages
│   │       ├── chat-highlight.tsx
│   │       ├── countdown.tsx
│   │       ├── emote-wall.tsx
│   │       ├── now-playing.tsx
│   │       └── weather.tsx
│   └── index.tsx                    # Landing page
├── components/
│   ├── dashboard/
│   │   ├── expanded/                # Detailed config panels per component
│   │   ├── CopyURLButton.tsx
│   │   ├── PositionControls.tsx
│   │   └── SessionInfo.tsx
│   └── overlay/                     # OBS overlay components
│       ├── ChatHighlight.tsx
│       ├── ChatMessage.tsx
│       ├── CountdownTimer.tsx
│       ├── EmoteWall.tsx
│       ├── NowPlaying.tsx
│       └── WeatherEffect.tsx
├── hooks/
│   ├── useSocket.ts                 # Dashboard WebSocket hook
│   └── useOverlaySocket.ts          # Overlay WebSocket hook
├── lib/
│   ├── env.ts                       # Environment variable validation
│   ├── prisma.ts                    # Prisma client singleton
│   ├── spotify.ts                   # Spotify API configuration
│   └── twitchChat.ts                # Twitch chat monitoring with tmi.js
├── prisma/
│   └── schema.prisma                # Database schema
├── types/
│   ├── next-auth.d.ts               # NextAuth type extensions
│   └── overlay.ts                   # Shared overlay types
├── .env.example                     # Environment variable template
└── CLAUDE.md                        # Developer documentation (AI-friendly)
```

## Usage

### Getting Started

1. Navigate to `http://localhost:3000`
2. Click **"Sign in with Twitch"**
3. Authorize the application
4. You'll be redirected to your dashboard with a unique session ID (e.g., `/dashboard/abc123`)

### Dashboard Overview

Your dashboard at `/dashboard/[sessionId]` is the control center for all overlays:

#### 🎮 Twitch Chat Integration

1. After signing in with Twitch, your username appears in the dashboard
2. Chat monitoring starts automatically for your channel
3. Navigate to the **Chat Highlight** panel to:
   - See all incoming chat messages in real-time
   - Search messages by username or content
   - Click any message to highlight it in your overlay
   - Messages are styled by role (subscriber, moderator, VIP, etc.)

#### 🎵 Spotify Integration

1. Click **"Connect Spotify"** in the Now Playing panel
2. Authorize the app in Spotify's OAuth flow
3. Now Playing automatically:
   - Updates track info every 5 seconds
   - Shows album art with dynamic color extraction
   - Displays progress bar synced with playback
   - Animates smoothly on track changes

#### ⏱️ Countdown Timers

1. Navigate to the **Countdown** panel
2. Click **"Create Timer"**
3. Set title, description, and target date/time
4. Toggle timers active/inactive
5. Watch confetti animation when timer reaches zero
6. Create unlimited timers per session

#### 🎨 Visual Customization

- **Color Schemes & Themes**: Choose from 18 professionally designed themes or create your own
  - **5 Categories**: Gaming, Chill, Vibrant, Minimal, and All
  - **Custom Color Builder**: Set your own primary, secondary, and accent colors with linear or radial gradients
  - **Smart Theming**: Overlay components (countdown timers, chat highlights, paint by numbers) automatically adapt their colors to match your selected theme
  - **Contrast Detection**: Text colors intelligently adjust based on theme luminance to ensure readability
  - Example themes: Cyberpunk (neon pink/cyan), Ocean (deep blues), Synthwave (80s retro), Noir (film noir black/white)
- **Weather Effects**: Add rain, snow, or fog with adjustable density
- **Emote Wall**: Configure floating emotes with custom count, speed, and scale
- **Component Positioning**: Drag and adjust x/y coordinates, width, and scale for each component

All changes save automatically and update in real-time across all overlay pages via WebSockets.

### Overlay Pages for OBS

You have two options for adding overlays to OBS:

#### Option 1: Combined Overlay (All Components)

URL: `http://localhost:3000/overlay/[your-session-id]`

Shows all active components on a single page. Toggle visibility per component from the dashboard.

#### Option 2: Individual Overlay Pages (Recommended)

Add each component as a separate browser source for better control:

| Component       | URL                                                        | Purpose                    |
| --------------- | ---------------------------------------------------------- | -------------------------- |
| Chat Highlight  | `http://localhost:3000/overlay/[sessionId]/chat-highlight` | Highlighted chat messages  |
| Now Playing     | `http://localhost:3000/overlay/[sessionId]/now-playing`    | Spotify current track      |
| Countdown Timer | `http://localhost:3000/overlay/[sessionId]/countdown`      | Active countdown timers    |
| Emote Wall      | `http://localhost:3000/overlay/[sessionId]/emote-wall`     | Floating emote particles   |
| Weather         | `http://localhost:3000/overlay/[sessionId]/weather`        | Rain, snow, or fog effects |

**Benefits of individual pages:**

- Layer components in different scenes
- Apply different filters/effects per component in OBS
- Better performance (only load what you need)
- Easier debugging

> 💡 **Tip:** Use the "Copy OBS URL" button in each dashboard panel for quick access.

## OBS Setup

### Adding a Browser Source

1. In OBS, click the **+** button in the Sources panel
2. Select **Browser**
3. Give it a descriptive name (e.g., "Chat Highlight" or "Now Playing")
4. Configure the browser source:

```
URL: http://localhost:3000/overlay/[your-session-id]/chat-highlight
Width: 1920
Height: 1080
FPS: 60
☑ Shutdown source when not visible (recommended for performance)
☑ Refresh browser when scene becomes active
```

5. Click **OK**
6. Resize and position in your scene as needed

### Recommended Settings Per Component

| Component      | Width | Height | Notes                               |
| -------------- | ----- | ------ | ----------------------------------- |
| Chat Highlight | 1920  | 1080   | Position controlled from dashboard  |
| Now Playing    | 1920  | 1080   | Usually bottom-left or bottom-right |
| Countdown      | 1920  | 1080   | Center or top-center                |
| Emote Wall     | 1920  | 1080   | Fullscreen overlay                  |
| Weather        | 1920  | 1080   | Fullscreen overlay, use low density |

### Performance Tips

- Enable "Shutdown source when not visible" for all overlays
- Use individual overlay pages instead of the combined overlay
- Disable components you're not actively using from the dashboard
- Consider lowering FPS to 30 for static components (Now Playing, Chat Highlight)
- Use hardware acceleration in OBS Settings → Advanced

## Customization

### Creating Custom Color Schemes

The application includes a **Custom Color Builder** accessible from the dashboard:

1. Navigate to the **Color Scheme** panel in your dashboard
2. Select the **Custom** category
3. Choose your colors:
   - **Primary Color**: Main theme color
   - **Secondary Color**: Complementary color for gradients
   - **Accent Color**: Highlight color for UI elements
4. Configure your gradient:
   - **Type**: Linear or Radial
   - **Direction**: 8 directional options (to-right, to-left, to-top, to-bottom, diagonals)
5. Watch your overlays update in real-time!

**Behind the Scenes**: The `useThemeColors` hook automatically:
- Generates lighter/darker color variants
- Calculates optimal text colors using luminance detection
- Ensures readability on dark backgrounds (critical for OBS)
- Creates CSS gradients for backgrounds and text

### Adding New Preset Themes

To add a permanent preset theme to the system, edit `lib/colorSchemes.ts`:

```typescript
{
  id: 'my-theme',
  name: 'My Theme',
  category: 'vibrant', // or 'gaming', 'chill', 'minimal'
  description: 'Description of your theme',
  gradient: 'from-color1-900/20 to-color2-900/20', // Tailwind classes
  preview: {
    primary: '#hexcolor1',
    secondary: '#hexcolor2',
    accent: '#hexcolor3'
  }
}
```

The theme system uses **WCAG-compliant luminance calculations** to ensure your colors are accessible.

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

## Deployment

### Production Checklist

Before deploying to production, ensure:

- [ ] All environment variables are set in your hosting platform
- [ ] `NEXTAUTH_URL` is set to your production domain
- [ ] `NEXTAUTH_SECRET` is generated securely (`openssl rand -base64 32`)
- [ ] Twitch OAuth redirect URIs include your production domain
- [ ] Spotify redirect URI is updated to production callback URL
- [ ] PostgreSQL database is provisioned and accessible
- [ ] Database migrations are run (`npx prisma migrate deploy`)
- [ ] Build succeeds locally (`npm run build`)

### Hosting Platforms

This app works with any platform that supports:

- Node.js server-side rendering
- WebSocket connections (Socket.io)
- PostgreSQL database

**Recommended platforms:**

- **Vercel** - Easiest deployment, add WebSocket support via Pusher or Ably
- **Railway** - Built-in PostgreSQL, WebSocket support
- **DigitalOcean App Platform** - Full control, WebSocket support
- **AWS/GCP/Azure** - Scalable, requires more configuration

### Environment Variables in Production

Reference `.env.example` for all required variables. Use your hosting platform's environment variable settings:

```bash
# Vercel: Project Settings → Environment Variables
# Railway: Project → Variables
# Other: Consult platform documentation
```

### Database Migrations

For production deployments:

```bash
# Generate migration files (do this before deploying)
npx prisma migrate dev --name initial_migration

# Deploy migrations in production
npx prisma migrate deploy
```

### Security Notes

- Socket.io CORS is restricted to `NEXTAUTH_URL` (no wildcards)
- Environment variables are validated on startup
- Database query logging is disabled in production
- All secrets should be stored as environment variables, never in code

## Developer Documentation

For detailed technical documentation, including:

- Complete API reference
- Socket.io event catalog
- Database schema details
- Architecture patterns
- Code examples and templates
- Development best practices

See **[CLAUDE.md](./CLAUDE.md)** - comprehensive documentation designed for both developers and AI assistants.

## Performance Tips

1. Reduce canvas resolution for lower-end systems
2. Disable unused layers from the dashboard
3. Use hardware acceleration in OBS settings
4. Consider using a dedicated machine for streaming
5. Keep the dashboard tab visible if using Spotify integration

## Troubleshooting

### WebSocket Issues

**Overlays not updating in real-time:**

- Ensure the Next.js dev server is running (`npm run dev`)
- Check browser console (F12) for WebSocket connection errors
- Verify you're using the same `sessionId` in both dashboard and overlay URLs
- Try refreshing both the dashboard and overlay pages

**"Failed to connect to socket" error:**

- Check if `/api/socket` endpoint is accessible
- Ensure no firewall is blocking WebSocket connections
- Try restarting the dev server

### OBS Browser Source Issues

**Overlay not visible in OBS:**

- Verify the URL includes your correct session ID
- Check browser source dimensions (should be 1920x1080)
- Right-click the source → Interact → Check browser console for errors
- Try toggling "Refresh browser when scene becomes active"

**Overlay is laggy or stuttering:**

- Enable "Shutdown source when not visible"
- Lower FPS from 60 to 30
- Disable unused components from the dashboard
- Check OBS logs for performance warnings

### Twitch Chat Issues

**Chat messages not appearing:**

- Verify you're signed in with Twitch
- Check that chat monitoring is active (green indicator in dashboard)
- Ensure you're streaming or have chat activity
- Try disconnecting and reconnecting in the Chat Highlight panel

**Chat disconnects randomly:**

- Server restarts will disconnect all chat monitors (this is normal)
- Reconnect from the dashboard after server restarts
- Check Twitch API status if issues persist

### Spotify Issues

**Now Playing not updating:**

- Ensure you're signed into Spotify and actively playing music
- Check that you authorized the app during OAuth flow
- Try disconnecting and reconnecting in the Now Playing panel
- Verify Spotify credentials in `.env.local`
- Check browser console for "401 Unauthorized" errors (token expired)

**Album art not loading:**

- Check if Spotify is providing album art (some tracks don't have it)
- Verify CORS isn't blocking images from `i.scdn.co`
- Try a different track

### Database Issues

**"Missing required environment variables" error:**

- Check that `.env.local` exists and has all required variables
- Compare with `.env.example` to ensure nothing is missing
- Restart the dev server after changing environment variables

**Database connection errors:**

- Ensure PostgreSQL is running: `docker-compose ps`
- Verify `DATABASE_URL` matches your docker-compose.yml settings
- Try restarting the database: `docker-compose restart`
- Check database logs: `docker-compose logs db`

**Migration errors:**

- Try resetting: `npm run db:reset` (⚠️ deletes all data)
- Or push schema manually: `npm run db:push`

### General Debugging

**Enable verbose logging:**

```bash
# In development, database queries are logged
# Check terminal output where you ran `npm run dev`
```

**Clear browser cache:**

- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Clear localStorage: Browser DevTools → Application → Local Storage → Clear

**Check for port conflicts:**

```bash
# If port 3000 is already in use
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows
```

## Technology Stack

### Core

- **Next.js 16** (React 19) - Full-stack framework with Pages Router
- **TypeScript** - Type safety throughout the application
- **Tailwind CSS 4** - Utility-first styling

### Backend & Database

- **PostgreSQL** - Primary database
- **Prisma ORM** - Type-safe database client
- **NextAuth.js** - Authentication (Twitch OAuth)

### Real-time Communication

- **Socket.io** - WebSocket server and client
- Custom React hooks for connection management

### Integrations

- **tmi.js** - Twitch chat monitoring
- **spotify-web-api-node** - Spotify API integration
- **ColorThief** - Album art color extraction

### Deployment-Ready

- Environment variable validation on startup
- Production-optimized logging
- CORS-restricted WebSocket connections
- Security best practices implemented

## Implemented Features ✅

- ✅ Real-time WebSocket communication with session isolation
- ✅ Twitch authentication with OAuth 2.0
- ✅ Live Twitch chat monitoring and highlighting
- ✅ Spotify "Now Playing" with OAuth and auto-refresh
- ✅ Dynamic album art color extraction
- ✅ Multiple countdown timers with database persistence
- ✅ Emote wall particle system
- ✅ Weather effects (rain, snow, fog)
- ✅ 18 color schemes with custom color builder and intelligent contrast detection
- ✅ Theme system with automatic color adaptation for all overlay components
- ✅ Component positioning system (x/y, width, scale)
- ✅ Individual overlay pages for granular OBS control
- ✅ Auto-save functionality
- ✅ Copy-to-clipboard OBS URLs
- ✅ Mobile-responsive dashboard
- ✅ Production-ready deployment configuration

## Future Enhancements 🚀

Potential features for future development:

- 🎮 Interactive viewer games via chat commands
- 🎨 Visual theme editor in dashboard
- 🎯 Goal/donation progress bars
- 🔊 Sound effect triggers and audio visualizer
- 🎁 Animated GIF/video support for alerts
- 📊 Stream statistics and leaderboards
- ⚡ Chat command system for viewers
- 🌈 More weather effects (leaves, stars, bubbles, sakura)
- 💾 Layout templates and presets
- 🔄 Multi-scene management
- 📱 Mobile app for remote control
- 🎪 Viewer poll/voting system

## How Sessions Work

Each user gets a unique **session ID** when they sign in with Twitch. This session ID:

- Identifies your specific overlay configuration
- Isolates your settings from other users
- Persists in the database (tied to your Twitch account)
- Appears in URLs: `/dashboard/[sessionId]` and `/overlay/[sessionId]/*`

**Key points:**

- One Twitch account can have multiple sessions (create new ones from the dashboard)
- Session IDs are UUIDs (e.g., `abc123-def456-ghi789`)
- All overlays for a session share the same settings via WebSocket rooms
- Deleting a session removes all associated timers and layouts

## Contributing

Contributions are welcome! Here's how you can help:

### Reporting Bugs

Open an issue with:

- Description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Browser/OBS version

### Suggesting Features

Open an issue with the "enhancement" label and describe:

- The feature and its use case
- How it would work from a user perspective
- Any technical considerations

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following existing code patterns
4. Test thoroughly (run `npm run type-check` and `npm run lint`)
5. Update documentation (README.md and CLAUDE.md if applicable)
6. Commit with clear messages
7. Push to your fork and open a pull request

**Development Guidelines:**

- Follow TypeScript best practices
- Use Prettier for formatting (`npm run format`)
- Write clear commit messages
- Update CLAUDE.md for architectural changes
- Test in OBS before submitting overlay changes

## Support

- 📖 **Documentation**: See [CLAUDE.md](./CLAUDE.md) for technical details
- 🐛 **Issues**: [GitHub Issues](../../issues)
- 💬 **Discussions**: [GitHub Discussions](../../discussions)

## License

MIT License - Feel free to use and modify for your streams!

---

**Built with** ❤️ **for the streaming community**

_Star this repo if you find it useful!_ ⭐
