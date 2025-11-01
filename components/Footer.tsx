// components/Footer.tsx
export default function Footer() {
  return (
    <div className='mt-8 text-center'>
      <div className='text-sm text-gray-400 mb-3'>
        Created by <span className='font-semibold text-gray-300'>Joe Powers</span>
      </div>
      <div className='flex items-center justify-center gap-6 text-sm'>
        <a
          href='https://twitch.tv/joepowers'
          target='_blank'
          rel='noopener noreferrer'
          className='text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2'
        >
          <svg
            className='w-4 h-4'
            fill='currentColor'
            viewBox='0 0 24 24'
          >
            <path d='M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z' />
          </svg>
          Twitch
        </a>
        <a
          href='https://github.com/ReadySetJoe'
          target='_blank'
          rel='noopener noreferrer'
          className='text-gray-400 hover:text-gray-300 transition-colors flex items-center gap-2'
        >
          <svg
            className='w-4 h-4'
            fill='currentColor'
            viewBox='0 0 24 24'
          >
            <path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' />
          </svg>
          GitHub
        </a>
        <a
          href='mailto:me@joepowers.dev'
          className='text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2'
        >
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
            />
          </svg>
          Email
        </a>
      </div>
    </div>
  );
}
