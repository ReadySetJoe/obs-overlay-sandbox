# OBS Overlay Sandbox - Developer Documentation

## Project Overview

**OBS Overlay Sandbox** is a real-time streaming overlay management system for Twitch streamers. It provides a dashboard interface where streamers can configure and customize various overlay components (chat highlights, now playing music, countdown timers, weather effects, emote walls) that appear in their OBS stream. The system uses WebSockets for real-time synchronization between the dashboard and overlay views.

**Key Use Case**: A Twitch streamer opens the dashboard to configure overlays, then adds individual overlay URLs as browser sources in OBS Studio. Changes made in the dashboard instantly appear in the OBS overlays via Socket.io.

## Tech Stack

### Core Framework

- **Next.js 16** (React 19) - Full-stack framework with Pages Router
- **TypeScript** - Type safety throughout
- **Tailwind CSS 4** - Styling

### Real-time Communication

- **Socket.io** (v4.8.1) - WebSocket server/client for real-time updates
- **Custom hooks** (`useSocket`, `useOverlaySocket`) - Socket connection management

### Authentication & Database

- **NextAuth.js** (v4.24.13) - OAuth authentication (Twitch provider)
- **Prisma** (v6.18.0) - ORM with PostgreSQL
- **PostgreSQL** - Database (via DATABASE_URL env var)

### Integrations

- **Twitch** - Authentication + live chat monitoring via `tmi.js`
- **Spotify** - Now Playing integration via `spotify-web-api-node`
- **ColorThief** - Album art color extraction for dynamic theming

### Build Tools

- **ESLint** + **Prettier** - Code quality
- **Turbopack** - Fast Next.js bundler

## Architecture Patterns

### Session-Based Isolation

- Each user gets a unique `sessionId` (UUID stored in Prisma `Layout` model)
- Sessions isolate overlay configurations between different streamers
- Socket.io rooms use `sessionId` for targeted broadcasts

### Real-time Data Flow

```
Dashboard UI → Socket.io Client → Socket.io Server → Socket.io Room (sessionId) → Overlay UI
```

1. User changes settings in dashboard (e.g., color scheme)
2. Dashboard emits event via socket with sessionId
3. Server broadcasts to all clients in that session's room
4. Overlay pages listening to that room update instantly

### Dual-View Pattern

- **Dashboard view**: `/dashboard/[sessionId]` - Control panel for streamers
- **Overlay views**: `/overlay/[sessionId]/*` - Individual components for OBS
  - Each overlay is a separate page that can be added to OBS as a browser source
  - Examples: `/overlay/abc123/chat-highlight`, `/overlay/abc123/now-playing`

## Project Structure

```
obs-overlay-sandbox/
├── components/
│   ├── dashboard/          # Dashboard UI components
│   │   ├── expanded/       # Detailed settings panels for each overlay
│   │   │   ├── ChatHighlightExpanded.tsx
│   │   │   ├── ColorSchemeExpanded.tsx
│   │   │   ├── CountdownExpanded.tsx
│   │   │   ├── EmoteWallExpanded.tsx
│   │   │   ├── NowPlayingExpanded.tsx
│   │   │   └── WeatherExpanded.tsx
│   │   ├── tiles/          # Dashboard summary tiles
│   │   ├── CopyURLButton.tsx
│   │   ├── PositionControls.tsx
│   │   ├── SessionInfo.tsx
│   │   └── ToggleSwitch.tsx
│   └── overlay/            # Actual overlay components rendered in OBS
│       ├── ChatHighlight.tsx
│       ├── ChatMessage.tsx
│       ├── CountdownTimer.tsx
│       ├── EmoteWall.tsx
│       ├── NowPlaying.tsx
│       └── WeatherEffect.tsx
├── pages/
│   ├── api/                # Backend API routes
│   │   ├── auth/
│   │   │   └── [...nextauth].ts    # NextAuth configuration
│   │   ├── layouts/
│   │   │   ├── list.ts             # Get all user layouts
│   │   │   ├── load.ts             # Load specific layout
│   │   │   └── save.ts             # Save layout changes
│   │   ├── spotify/
│   │   │   ├── login.ts
│   │   │   ├── callback.ts
│   │   │   ├── refresh.ts
│   │   │   └── now-playing.ts
│   │   ├── timers/
│   │   │   ├── create.ts
│   │   │   ├── list.ts
│   │   │   └── [timerId].ts        # Update/delete timer
│   │   ├── twitch/
│   │   │   ├── connect-chat.ts     # Start monitoring Twitch chat
│   │   │   └── disconnect-chat.ts
│   │   └── socket.ts               # Socket.io initialization
│   ├── dashboard/
│   │   └── [sessionId].tsx         # Main dashboard page
│   ├── overlay/
│   │   ├── [sessionId].tsx         # Combined overlay (all components)
│   │   └── [sessionId]/            # Individual overlay pages
│   │       ├── chat-highlight.tsx
│   │       ├── countdown.tsx
│   │       ├── emote-wall.tsx
│   │       ├── now-playing.tsx
│   │       └── weather.tsx
│   ├── _app.tsx                    # NextAuth SessionProvider wrapper
│   ├── _document.tsx               # Custom document for viewport
│   └── index.tsx                   # Landing page
├── lib/
│   ├── env.ts                      # Environment variable validation
│   ├── prisma.ts                   # Prisma client singleton
│   ├── spotify.ts                  # Spotify API configuration
│   └── twitchChat.ts               # Twitch chat monitoring logic
├── hooks/
│   ├── useSocket.ts                # Socket connection hook
│   └── useOverlaySocket.ts         # Overlay-specific socket hook
├── types/
│   ├── next-auth.d.ts              # NextAuth type extensions
│   └── overlay.ts                  # Shared types for overlays
├── prisma/
│   └── schema.prisma               # Database schema
└── styles/
    └── globals.css                 # Global styles
```

## Database Schema (Prisma)

### Core Models

**User** (NextAuth)

- `id`, `name`, `email`, `emailVerified`, `image`
- Relations: `accounts[]`, `sessions[]`, `layouts[]`

**Layout** (User's overlay configuration)

- `id`, `userId`, `sessionId` (unique)
- `name` - Layout name
- `colorScheme` - Color theme (default, sunset, ocean, etc.)
- `weatherEffect` - Weather overlay type (rain, snow, none)
- `*Visible` - Boolean flags for component visibility
- `componentLayouts` - JSON string storing position/size for each component
  ```json
  {
    "chat": { "position": "top-left", "x": 0, "y": 80, "maxWidth": 400 },
    "nowPlaying": { "position": "top-left", "x": 0, "y": 0, "width": 400 },
    "countdown": { "position": "top-left", "x": 0, "y": 0, "scale": 1 },
    "weather": { "density": 1 }
  }
  ```
- Relations: `countdowns[]`

**CountdownTimer**

- `id`, `layoutId`, `title`, `description`, `targetDate`, `isActive`
- Stores individual countdown timers for a layout

**Account, Session, VerificationToken** - NextAuth models

### Key Relationships

```
User (1) ─── (many) Layout
Layout (1) ─── (many) CountdownTimer
```

## Key Components & Features

### 1. Chat Highlight System

**Flow**: Twitch Chat → `tmi.js` → Socket.io → Dashboard + Overlay

**Files**:

- `lib/twitchChat.ts` - Chat monitoring with `tmi.js` client
- `pages/api/twitch/connect-chat.ts` - Start monitoring endpoint
- `components/overlay/ChatHighlight.tsx` - Displays highlighted message
- `components/dashboard/expanded/ChatHighlightExpanded.tsx` - Message selection UI

**Data Flow**:

1. User authenticates with Twitch (NextAuth)
2. Dashboard calls `/api/twitch/connect-chat` with username
3. Server creates `tmi.js` client, joins channel
4. On chat message → emit `chat-message` event to session room
5. Dashboard receives messages, user clicks to highlight
6. Emits `chat-highlight` event
7. Overlay displays highlighted message with role-based styling

**User Roles**: `viewer`, `subscriber`, `moderator`, `vip`, `first-timer`

### 2. Now Playing (Spotify)

**Flow**: Spotify OAuth → Polling → Socket.io → Overlay

**Files**:

- `lib/spotify.ts` - Spotify API client setup
- `pages/api/spotify/*` - OAuth flow and now-playing endpoint
- `components/overlay/NowPlaying.tsx` - Album art + track info display

**Features**:

- OAuth flow stores access/refresh tokens in localStorage
- Dashboard polls `/api/spotify/now-playing` every 5 seconds
- ColorThief extracts dominant color from album art
- Dynamic gradient background based on album colors
- Emits `now-playing` event with track data to overlay

### 3. Countdown Timers

**Files**:

- `pages/api/timers/*` - CRUD operations
- `components/overlay/CountdownTimer.tsx` - Display with animations

**Features**:

- Multiple timers per layout stored in database
- Real-time countdown with days/hours/minutes/seconds
- Confetti animation when timer reaches zero
- Toggle active/inactive state

### 4. Emote Wall

**Files**: `components/overlay/EmoteWall.tsx`

**Features**:

- Canvas-based particle system
- Configurable emote (emoji), count, speed, scale
- Physics simulation for floating emotes

### 5. Weather Effects

**Files**: `components/overlay/WeatherEffect.tsx`

**Types**: Rain, snow, fog, none
**Features**: Canvas-based particle systems with configurable density

### 6. Color Schemes

Predefined themes that change overlay styling:

- `default`, `sunset`, `ocean`, `forest`, `purple-haze`, `neon`, `monochrome`
- Emits `color-scheme-change` and `custom-colors-change` events

## API Routes Reference

### Authentication

- `GET /api/auth/signin` - NextAuth sign-in page
- `POST /api/auth/signout` - Sign out
- `GET/POST /api/auth/[...nextauth]` - NextAuth handler

### Layouts

- `GET /api/layouts/list?userId={userId}` - Get all user layouts
- `GET /api/layouts/load?sessionId={sessionId}` - Load specific layout
- `POST /api/layouts/save` - Save layout (creates if doesn't exist)
  - Body: `{ userId, sessionId, name?, colorScheme?, weatherEffect?, *Visible, componentLayouts }`

### Timers

- `GET /api/timers/list?sessionId={sessionId}` - Get all timers for layout
- `POST /api/timers/create` - Create timer
  - Body: `{ sessionId, title, description?, targetDate, isActive }`
- `PUT /api/timers/[timerId]` - Update timer
- `DELETE /api/timers/[timerId]` - Delete timer

### Spotify

- `GET /api/spotify/login?sessionId={sessionId}` - Get OAuth URL
- `GET /api/spotify/callback?code={code}&state={sessionId}` - OAuth callback
- `GET /api/spotify/now-playing?sessionId={sessionId}` - Get current track
- `POST /api/spotify/refresh` - Refresh access token
  - Body: `{ refreshToken }`

### Twitch

- `POST /api/twitch/connect-chat` - Start monitoring Twitch chat
  - Body: `{ twitchUsername, sessionId }`
- `POST /api/twitch/disconnect-chat` - Stop monitoring
  - Body: `{ sessionId }`

### WebSockets

- `GET /api/socket` - Initialize Socket.io server
  - Idempotent - only creates server once
  - CORS restricted to `NEXTAUTH_URL`

## Socket.io Events

### Client → Server

- `join-session` - Join a session room (payload: `sessionId`)
- `chat-message` - Forward chat message (payload: `ChatMessage`)
- `chat-highlight` - Highlight a chat message (payload: `ChatHighlight`)
- `color-scheme-change` - Change color scheme (payload: `{ colorScheme }`)
- `custom-colors-change` - Change custom colors (payload: `{ colors }`)
- `weather-change` - Change weather effect (payload: `{ effect, density }`)
- `now-playing` - Update now playing (payload: `{ track, artist, albumArt }`)
- `scene-toggle` - Toggle scene visibility (payload: `{ scene, visible }`)
- `component-layouts` - Update component positions (payload: `ComponentLayouts`)
- `countdown-timers` - Update timers (payload: `CountdownTimer[]`)
- `emote-wall` - Configure emote wall (payload: `EmoteWallConfig`)
- `visualizer-config` - Audio visualizer config
- `audio-data` - Audio visualization data

### Server → Client

Same event names, broadcasted to session room

## Environment Variables

See `.env.example` for full reference.

### Required

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - NextAuth encryption secret (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Application URL (http://localhost:3000 or production URL)
- `TWITCH_CLIENT_ID` - Twitch OAuth app ID
- `TWITCH_CLIENT_SECRET` - Twitch OAuth app secret

### Optional (Spotify features)

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REDIRECT_URI`

### Validation

`lib/env.ts` validates all required variables on server startup. Missing required vars will throw an error with clear message.

## Common Development Tasks

### Setup

```bash
# Install dependencies
npm install

# Set up database
cp .env.example .env
# Edit .env with your values
npx prisma db push
npx prisma generate

# Run development server
npm run dev
```

### Database Changes

```bash
# After modifying schema.prisma
npx prisma db push          # Push schema to database
npx prisma generate         # Regenerate Prisma client
npx prisma studio           # Open database GUI
```

### Code Quality

```bash
npm run lint                # Check for errors
npm run format              # Format code
npm run type-check          # TypeScript validation
npm run build               # Test production build
```

### Creating a New Overlay Component

1. **Create overlay component** in `components/overlay/YourOverlay.tsx`
   - Use `useOverlaySocket(sessionId)` to connect to socket
   - Listen for relevant events (e.g., `socket.on('your-event', handler)`)
   - Render transparent background for OBS chroma key

2. **Create dashboard panel** in `components/dashboard/expanded/YourOverlayExpanded.tsx`
   - Provide configuration UI
   - Emit events via socket when settings change
   - Include `<CopyURLButton>` for OBS URL

3. **Create overlay page** in `pages/overlay/[sessionId]/your-overlay.tsx`

   ```tsx
   export default function YourOverlayPage() {
     const router = useRouter();
     const { sessionId } = router.query;
     return <YourOverlay sessionId={sessionId as string} />;
   }
   ```

4. **Update dashboard** (`pages/dashboard/[sessionId].tsx`)
   - Add state for your overlay config
   - Add to expanded panel selector
   - Save config to `componentLayouts` JSON

5. **Update types** (`types/overlay.ts`)
   - Add config interface
   - Update `ComponentLayouts` type

## Performance Considerations

### Socket.io Optimization

- Events are room-scoped (only sessionId participants receive updates)
- Audio data uses `socket.to(sessionId)` (excludes sender) to prevent echo

### Database

- Prisma query logging disabled in production (see `lib/prisma.ts`)
- `componentLayouts` stored as JSON string for flexibility (trade-off: not queryable)

### Next.js

- Static generation where possible (`○` routes in build output)
- API routes are serverless functions (cold start consideration)

## Security Notes

### CORS Configuration

- Socket.io restricted to `NEXTAUTH_URL` origin (see `pages/api/socket.ts:27`)
- Never use `origin: '*'` in production

### Authentication

- All dashboard/settings endpoints should validate session
- Overlay endpoints are public (needed for OBS browser sources)
- Twitch chat monitoring requires authenticated user

### Secrets

- Never commit `.env` files (`.gitignore` configured)
- Use environment variables for all secrets
- `lib/env.ts` validates presence but doesn't log values

## Deployment Checklist

- [ ] Set all environment variables in hosting platform
- [ ] Update `NEXTAUTH_URL` to production domain
- [ ] Generate secure `NEXTAUTH_SECRET`
- [ ] Update Twitch OAuth app redirect URIs
- [ ] Update Spotify redirect URI
- [ ] Run database migrations (`npx prisma migrate deploy`)
- [ ] Verify Socket.io WebSocket support on hosting platform
- [ ] Test build locally (`npm run build`)
- [ ] Configure PostgreSQL database with SSL

## Known Issues & Limitations

### Linting

- Some React hooks optimization warnings (dependency arrays)
- Performance suggestions (Next.js Image component vs img tags)
- These don't affect functionality, address as needed

### Twitch Chat

- Chat monitoring runs in-memory (not persisted)
- Server restart disconnects all chat monitors
- One active connection per sessionId

### Spotify

- Tokens stored in localStorage (client-side only)
- Requires manual re-auth if tokens expire
- No server-side token refresh implementation

### Socket.io

- Requires WebSocket support from hosting platform
- Some platforms (Vercel) may need special configuration
- Consider persistent connection services for production

## Useful File Patterns

### Adding a new API route

```typescript
// pages/api/your-route.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Optional: Require authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    // Handle GET
  } else if (req.method === 'POST') {
    // Handle POST
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
```

### Socket event pattern (Dashboard)

```typescript
const socket = useSocket();

// Emit event
socket?.emit('your-event', { sessionId, ...data });

// Listen for events
useEffect(() => {
  if (!socket) return;

  socket.on('your-event', data => {
    // Handle event
  });

  return () => {
    socket.off('your-event');
  };
}, [socket]);
```

### Socket event pattern (Overlay)

```typescript
const socket = useOverlaySocket(sessionId);

useEffect(() => {
  if (!socket) return;

  socket.on('your-event', data => {
    setYourState(data);
  });

  return () => {
    socket.off('your-event');
  };
}, [socket, sessionId]);
```

## Additional Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth.js Docs](https://next-auth.js.org)
- [Socket.io Docs](https://socket.io/docs)
- [tmi.js Docs](https://github.com/tmijs/tmi.js)
- [Spotify Web API](https://developer.spotify.com/documentation/web-api)

## Questions to Ask When Working on This Codebase

1. **Does this feature need real-time updates?** → Use Socket.io
2. **Should this be authenticated?** → Check session in API route
3. **Is this overlay or dashboard?** → Different file locations and patterns
4. **Does this need to persist?** → Add to Prisma schema or componentLayouts JSON
5. **Will OBS render this?** → Ensure transparent background, test in OBS
6. **Does this affect layout?** → Update componentLayouts and position controls

---

**Last Updated**: 2025-10-31
**Version**: 0.1.0
**Maintainer**: Joe

For questions or contributions, refer to this document as the source of truth for architectural decisions and patterns.
