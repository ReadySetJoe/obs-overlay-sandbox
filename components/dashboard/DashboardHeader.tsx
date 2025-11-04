// components/dashboard/DashboardHeader.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Session } from 'next-auth';
import SessionInfo from '@/components/dashboard/SessionInfo';
import UserProfileDropdown from '@/components/UserProfileDropdown';
import Image from 'next/image';

interface DashboardHeaderProps {
  sessionId: string | undefined;
  session: Session | null;
  isConnected: boolean;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  layoutName?: string;
  onLayoutNameChange?: (name: string) => void;
}

export default function DashboardHeader({
  sessionId,
  session,
  isConnected,
  saveStatus,
  layoutName,
  onLayoutNameChange,
}: DashboardHeaderProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(layoutName || 'My Layout');

  const handleStartRename = () => {
    setNewName(layoutName || 'My Layout');
    setIsRenaming(true);
  };

  const handleCancelRename = () => {
    setIsRenaming(false);
    setNewName(layoutName || 'My Layout');
  };

  const handleSaveRename = async () => {
    if (!newName.trim()) {
      alert('Layout name cannot be empty');
      return;
    }

    if (!sessionId) {
      return;
    }

    try {
      const res = await fetch('/api/layouts/rename', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, name: newName.trim() }),
      });

      if (res.ok) {
        onLayoutNameChange?.(newName.trim());
        setIsRenaming(false);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to rename layout');
      }
    } catch (error) {
      console.error('Error renaming layout:', error);
      alert('Failed to rename layout');
    }
  };

  return (
    <div className='relative mb-8 md:mb-12'>
      <div className='absolute top-2 right-2'>
        <UserProfileDropdown />
      </div>
      <Link href='/' className='block'>
        <Image
          src='/title-white.png'
          alt='Joe-verlay'
          className='mx-auto mb-6 max-w-sm md:max-w-md w-full'
          width={400}
          height={100}
        />
      </Link>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div className='flex-1'>
          {isRenaming && session ? (
            <div className='flex items-center gap-2 mb-2'>
              <input
                type='text'
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleSaveRename();
                  } else if (e.key === 'Escape') {
                    handleCancelRename();
                  }
                }}
                className='flex-1 px-4 py-2 bg-gray-800/50 border border-purple-500/50 rounded-lg text-white text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/50'
                autoFocus
              />
              <button
                onClick={handleSaveRename}
                className='p-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors'
                title='Save'
              >
                <svg
                  className='w-5 h-5'
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
              </button>
              <button
                onClick={handleCancelRename}
                className='p-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors'
                title='Cancel'
              >
                <svg
                  className='w-5 h-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>
          ) : (
            <div className='flex items-center gap-2 mb-2'>
              <h1 className='text-3xl md:text-4xl font-bold'>
                {layoutName || 'Overlay Dashboard'}
              </h1>
              {session && layoutName && (
                <button
                  onClick={handleStartRename}
                  className='p-2 hover:bg-gray-700/50 rounded-lg transition-all opacity-60 hover:opacity-100'
                  title='Rename layout'
                >
                  <svg
                    className='w-5 h-5 text-gray-400 hover:text-white'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
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
        <SessionInfo
          sessionId={sessionId as string}
          isAuthenticated={!!session}
        />
      )}
    </div>
  );
}
