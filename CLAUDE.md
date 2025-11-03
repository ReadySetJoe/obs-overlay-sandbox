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
- **Cloudinary** - Cloud storage for custom background images with auto-optimization
- **Canvas API** - Server-side image processing for color extraction (via `canvas` npm package)

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
│   │   │   ├── BackgroundExpanded.tsx
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
│   │   ├── backgrounds/
│   │   │   ├── upload.ts           # Upload custom background
│   │   │   ├── delete.ts           # Delete background
│   │   │   └── apply-colors.ts     # Apply extracted colors to theme
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
│   │       ├── background.tsx
│   │       ├── chat-highlight.tsx
│   │       ├── countdown.tsx
│   │       ├── emote-wall.tsx
│   │       ├── now-playing.tsx
│   │       └── weather.tsx
│   ├── _app.tsx                    # NextAuth SessionProvider wrapper
│   ├── _document.tsx               # Custom document for viewport
│   └── index.tsx                   # Landing page
├── lib/
│   ├── cloudinary.ts               # Cloudinary SDK configuration and helpers
│   ├── colorExtraction.ts          # K-means color extraction from images
│   ├── colorSchemes.ts             # 18 preset color scheme definitions
│   ├── colorUtils.ts               # Color validation and parsing utilities
│   ├── env.ts                      # Environment variable validation
│   ├── prisma.ts                   # Prisma client singleton
│   ├── spotify.ts                  # Spotify API configuration
│   └── twitchChat.ts               # Twitch chat monitoring logic
├── hooks/
│   ├── useSocket.ts                # Socket connection hook
│   ├── useOverlaySocket.ts         # Overlay-specific socket hook
│   └── useThemeColors.ts           # Theme color generation with contrast detection
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
- `customColors` - JSON string for custom color scheme
- `weatherEffect` - Weather overlay type (rain, snow, none)
- `*Visible` - Boolean flags for component visibility (chatVisible, nowPlayingVisible, countdownVisible, chatHighlightVisible, paintByNumbersVisible, weatherVisible)
- `componentLayouts` - JSON string storing position/size for each component
  ```json
  {
    "chat": { "position": "top-left", "x": 0, "y": 80, "maxWidth": 400 },
    "nowPlaying": { "position": "top-left", "x": 0, "y": 0, "width": 400 },
    "countdown": { "position": "top-left", "x": 0, "y": 0, "scale": 1 },
    "weather": { "density": 1 },
    "chatHighlight": {
      "position": "bottom-left",
      "x": 20,
      "y": 20,
      "width": 500,
      "scale": 1
    },
    "paintByNumbers": {
      "position": "top-left",
      "x": 0,
      "y": 0,
      "scale": 1,
      "gridSize": 20
    }
  }
  ```
- **Custom Background Fields**:
  - `backgroundImageUrl` - Cloudinary URL for uploaded background image
  - `backgroundImagePublicId` - Cloudinary public_id for deletion
  - `backgroundImageName` - Original filename for display
  - `backgroundColors` - JSON string of extracted color palette
  - `backgroundOpacity` - Float (0.0-1.0, default 1.0) for background transparency
  - `backgroundBlur` - Integer (0-20, default 0) for blur effect in pixels
  - `backgroundUploadedAt` - Timestamp of upload
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

### 6. Color Schemes & Theme System

**Files**:

- `lib/colorSchemes.ts` - 18 preset color scheme definitions
- `hooks/useThemeColors.ts` - Theme color generation hook with contrast detection
- `types/overlay.ts` - ColorScheme and CustomColors types

**Architecture**:

The theme system provides centralized color management for all overlay components. Each overlay component (CountdownTimer, ChatHighlight, PaintByNumbers) receives the active `colorScheme` and `customColors` props and uses the `useThemeColors` hook to generate consistent, contrast-aware colors.

**Available Presets** (18 total):

- **All**: `default`
- **Gaming**: `gaming`, `cyberpunk`, `retro-arcade`, `fps-modern`
- **Chill**: `chill`, `sunset`, `ocean`, `forest`, `lavender`
- **Vibrant**: `energetic`, `neon`, `synthwave`, `vaporwave`, `rainbow`, `candy`
- **Minimal**: `dark`, `monochrome`, `pastel`, `noir`
- **Custom**: User-created with custom primary/secondary/accent colors and gradient settings

**Color Scheme Preset Structure** (`lib/colorSchemes.ts`):

```typescript
{
  id: 'ocean',
  name: 'Ocean',
  category: 'chill',
  description: 'Deep blue ocean depths',
  gradient: 'from-blue-900/20 via-cyan-900/20 to-teal-900/20', // Tailwind classes for backgrounds
  preview: {
    primary: '#1e3a8a',   // Base color 1
    secondary: '#164e63', // Base color 2
    accent: '#14b8a6'     // Accent color
  }
}
```

**Theme Colors Hook** (`useThemeColors`):

Generates a comprehensive color palette from the active color scheme:

```typescript
const theme = useThemeColors(colorScheme, customColors);

// Returns:
{
  // Base colors
  primary: string,
  secondary: string,
  accent: string,

  // Variants (+/- 20% lightness)
  primaryLight: string,
  primaryDark: string,
  secondaryLight: string,
  secondaryDark: string,
  accentLight: string,
  accentDark: string,

  // Contrast-aware text colors (guaranteed visibility on dark backgrounds)
  primaryText: string,    // Auto-adjusted based on luminance
  secondaryText: string,
  accentText: string,

  // Pre-generated CSS gradients
  gradientBg: string,     // For backgrounds
  gradientText: string    // For text with bg-clip-text
}
```

**Contrast Detection**:

The hook includes intelligent luminance-based contrast detection:

- Colors with luminance < 0.1 (very dark) → lightened by 80%
- Colors with luminance 0.1-0.3 (dark) → lightened by 60%
- Colors with luminance > 0.3 (bright) → lightened by 20%

This ensures text remains readable on dark overlay backgrounds across all themes, including `dark`, `noir`, and `monochrome`.

**Usage in Components**:

All themed overlay components follow this pattern:

```typescript
import { useThemeColors } from '@/hooks/useThemeColors';

function CountdownTimer({ colorScheme, customColors, ...props }) {
  const theme = useThemeColors(colorScheme, customColors);

  return (
    <div style={{ borderColor: theme.primary }}>
      <h1 style={{ backgroundImage: theme.gradientText }}>Title</h1>
      <span style={{ color: theme.primaryText }}>Count: 42</span>
      <div style={{ backgroundImage: theme.gradientBg }} />
    </div>
  );
}
```

**Themed Components**:

- ✅ **CountdownTimer** - Title gradient, time cell colors, progress bar
- ✅ **ChatHighlight** - Role-based backgrounds using theme variants, highlight badge
- ✅ **PaintByNumbers** - Header gradient, instruction text, progress bar

**Real-time Updates**:

When a user changes the color scheme in the dashboard:

1. Dashboard emits `color-scheme-change` event (for presets) or `custom-colors-change` (for custom)
2. `useOverlaySocket` receives the event and updates `colorScheme`/`customColors` state
3. Components re-render with new theme colors via `useThemeColors` hook
4. Colors transition smoothly to match the selected theme

**Socket Events**:

- `color-scheme-change` - Emitted when preset scheme selected (payload: ColorScheme string)
- `custom-colors-change` - Emitted when custom colors modified (payload: CustomColors object)

### 7. Custom Background System

**Flow**: Image Upload → Cloudinary → Color Extraction → Database → Socket.io → Overlay

**Files**:

- `lib/cloudinary.ts` - Cloudinary SDK configuration and image upload/delete helpers
- `lib/colorExtraction.ts` - K-means clustering algorithm for dominant color extraction
- `pages/api/backgrounds/upload.ts` - Upload endpoint with validation and processing
- `pages/api/backgrounds/delete.ts` - Delete endpoint with Cloudinary cleanup
- `pages/api/backgrounds/apply-colors.ts` - Apply extracted colors to custom theme
- `components/dashboard/expanded/BackgroundExpanded.tsx` - Upload UI with drag & drop
- `pages/overlay/[sessionId]/background.tsx` - Dedicated background overlay page
- `pages/overlay/[sessionId].tsx` - Main overlay with background layer support

**Architecture**:

Users can upload custom background images (PNG, JPG, WebP up to 10MB) that are stored in Cloudinary and automatically optimized for streaming. The system extracts dominant colors from the uploaded image using k-means clustering and can apply them to the custom theme for a cohesive visual experience.

**Image Optimization** (`lib/cloudinary.ts`):

- Auto-resize to 1920x1080 (standard streaming resolution)
- Auto-conversion to WebP format for better compression
- Quality optimization (auto quality)
- Responsive transformations available

```typescript
await uploadToCloudinary(filePath, 'overlay-backgrounds');
// Returns: { url, public_id, width, height, format }
```

**Color Extraction** (`lib/colorExtraction.ts`):

Uses k-means clustering algorithm to find the 8 most dominant colors in an image, then intelligently selects:

- **Primary**: Most dominant color (largest cluster)
- **Secondary**: Contrasting color with sufficient color distance (>100 RGB units)
- **Accent**: Highest luminance contrast to primary

```typescript
const colors = await extractColorsFromImage(imageUrl);
// Returns:
{
  palette: ['#1a2b3c', '#4d5e6f', ...],  // 8 dominant colors
  primary: '#1a2b3c',                     // Most dominant
  secondary: '#4d5e6f',                   // Contrasting
  accent: '#e8f4f8'                       // High luminance contrast
}
```

**Upload Flow**:

1. User drags/selects image in `BackgroundExpanded` component
2. File validated (type, size) and uploaded via multipart form
3. `upload.ts` API route:
   - Saves temporary file with formidable
   - Uploads to Cloudinary with optimization
   - Extracts color palette using Canvas API
   - Saves background data to database
   - Broadcasts `background-change` socket event
4. Overlay pages receive event and update background display
5. Temporary file cleaned up

**Background Display**:

Two rendering modes:

- **Main overlay** (`/overlay/[sessionId].tsx`): Background layer at z-index -10, gradient fallback at z-index -20
- **Background-only** (`/overlay/[sessionId]/background.tsx`): Dedicated page showing only the background

Both support:

- Opacity control (0-100%)
- Blur effect (0-20px)
- Real-time updates via Socket.io

**Layer Stacking** (z-index hierarchy):

```
-20: Gradient fallback (always present, hidden when custom background active)
-10: Custom background (when uploaded)
  0+: Overlay components (chat, timers, etc.)
```

**State Management** (`hooks/useOverlaySocket.ts`):

```typescript
const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(
  null
);
const [backgroundOpacity, setBackgroundOpacity] = useState(1.0);
const [backgroundBlur, setBackgroundBlur] = useState(0);

// Load from database on mount
useEffect(() => {
  fetch(`/api/layouts/load?sessionId=${sessionId}`)
    .then(res => res.json())
    .then(({ layout }) => {
      setBackgroundImageUrl(layout.backgroundImageUrl);
      setBackgroundOpacity(layout.backgroundOpacity);
      setBackgroundBlur(layout.backgroundBlur);
    });
}, [sessionId]);

// Listen for real-time updates
socket.on('background-change', data => {
  setBackgroundImageUrl(data.backgroundImageUrl);
  setBackgroundOpacity(data.backgroundOpacity);
  setBackgroundBlur(data.backgroundBlur);
});
```

**Features**:

- Drag & drop or click-to-browse upload UI
- Upload progress indicator
- Image preview with thumbnail
- Opacity slider (0-100%)
- Blur slider (0-20px)
- Visual color palette display with hex codes
- One-click "Apply Colors to Theme" button
- Delete background with confirmation
- Real-time sync across all overlay pages
- Automatic image optimization for streaming
- 10MB file size limit
- Cloudinary free tier: 25GB storage, 25GB bandwidth/month

**Socket Events**:

- `background-change` - Emitted when background uploaded, updated, or deleted
  - Payload: `{ backgroundImageUrl: string | null, backgroundOpacity: number, backgroundBlur: number }`

## API Routes Reference

### Authentication

- `GET /api/auth/signin` - NextAuth sign-in page
- `POST /api/auth/signout` - Sign out
- `GET/POST /api/auth/[...nextauth]` - NextAuth handler

### Backgrounds

- `POST /api/backgrounds/upload` - Upload custom background image
  - Content-Type: `multipart/form-data`
  - Fields: `file` (image file), `sessionId` (string)
  - Validation: JPG/PNG/WebP, max 10MB
  - Returns: `{ success: boolean, imageUrl: string, colors: ExtractedColors, width: number, height: number }`
- `POST /api/backgrounds/delete` - Delete background image
  - Body: `{ sessionId }`
  - Deletes from Cloudinary and database
- `POST /api/backgrounds/apply-colors` - Apply extracted colors to custom theme
  - Body: `{ sessionId, primary: string, secondary: string, accent: string }`
  - Sets colorScheme to 'custom' and updates customColors

### Layouts

- `GET /api/layouts/list?userId={userId}` - Get all user layouts
- `GET /api/layouts/load?sessionId={sessionId}` - Load specific layout
- `POST /api/layouts/save` - Save layout (creates if doesn't exist)
  - Body: `{ userId, sessionId, name?, colorScheme?, customColors?, weatherEffect?, *Visible, componentLayouts, background* }`

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
- `background-change` - Update background (payload: `{ backgroundImageUrl, backgroundOpacity, backgroundBlur }`)
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
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name (required for custom backgrounds)
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

### Optional

**Spotify features**:

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

**Last Updated**: 2025-11-02
**Version**: 0.2.0
**Maintainer**: Joe

For questions or contributions, refer to this document as the source of truth for architectural decisions and patterns.
