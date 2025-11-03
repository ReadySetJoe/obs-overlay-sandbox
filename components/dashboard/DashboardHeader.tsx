// components/dashboard/DashboardHeader.tsx
import Link from 'next/link';
import SessionInfo from '@/components/dashboard/SessionInfo';

interface DashboardHeaderProps {
  sessionId: string | undefined;
  session: any;
  isConnected: boolean;
  saveStatus: 'saved' | 'saving' | 'unsaved';
}

export default function DashboardHeader({
  sessionId,
  session,
  isConnected,
  saveStatus,
}: DashboardHeaderProps) {
  return (
    <div className='mb-8 md:mb-12'>
      <Link href='/' className='block'>
        <img
          src='/title-white.png'
          alt='Joe-verlay'
          className='mx-auto mb-6 max-w-sm md:max-w-md w-full'
        />
      </Link>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div>
          <h1 className='text-3xl md:text-4xl font-bold'>Overlay Dashboard</h1>
          <p className='text-gray-400 text-sm md:text-base'>
            Configure your stream overlay in real-time
          </p>
        </div>
        <div className='flex items-center gap-3'>
          {/* Save Status */}
          {session && (
            <div className='bg-gray-800/50 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-700'>
              <div className='flex items-center gap-2'>
                {saveStatus === 'saved' && (
                  <>
                    <svg
                      className='w-4 h-4 text-green-400'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M5 13l4 4L19 7'
                      />
                    </svg>
                    <span className='text-sm text-green-400'>Saved</span>
                  </>
                )}
                {saveStatus === 'saving' && (
                  <>
                    <div className='w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin' />
                    <span className='text-sm text-blue-400'>Saving...</span>
                  </>
                )}
                {saveStatus === 'unsaved' && (
                  <>
                    <div className='w-2 h-2 bg-yellow-400 rounded-full' />
                    <span className='text-sm text-yellow-400'>Unsaved</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Connection Status */}
          <div className='bg-gray-800/50 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-700'>
            <div className='flex items-center gap-2'>
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected
                    ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50'
                    : 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50'
                }`}
              />
              <span className='text-sm font-semibold'>
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Session Info */}
      {sessionId && (
        <SessionInfo sessionId={sessionId as string} isAuthenticated={!!session} />
      )}
    </div>
  );
}
