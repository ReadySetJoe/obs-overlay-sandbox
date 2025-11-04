// pages/profile.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Footer from '@/components/Footer';
import UserProfileDropdown from '@/components/UserProfileDropdown';
import Image from 'next/image';

interface Layout {
  id: string;
  sessionId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (status === 'authenticated') {
      fetchLayouts();
    }
  }, [status, router]);

  const fetchLayouts = async () => {
    try {
      const res = await fetch('/api/layouts/list');
      const data = await res.json();
      setLayouts(data.layouts || []);
    } catch (error) {
      console.error('Error fetching layouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (layoutId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this layout? This cannot be undone.'
      )
    ) {
      return;
    }

    setDeletingId(layoutId);
    try {
      const res = await fetch(`/api/layouts/${layoutId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setLayouts(layouts.filter(l => l.id !== layoutId));
      } else {
        alert('Failed to delete layout');
      }
    } catch (error) {
      console.error('Error deleting layout:', error);
      alert('Failed to delete layout');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter and sort layouts
  const filteredLayouts = layouts
    .filter(
      layout =>
        layout.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        layout.sessionId.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const generateSessionId = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  };

  const createNewLayout = () => {
    const newSessionId = generateSessionId();
    router.push(`/dashboard/${newSessionId}`);
  };

  if (status === 'loading' || loading) {
    return (
      <div className='min-h-screen bg-linear-to-br from-purple-900 via-blue-900 to-gray-900 text-white flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4'></div>
          <p className='text-lg'>Loading your layouts...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <Head>
        <title>My Layouts - Joeverlay Stream Overlay System</title>
        <meta
          name='description'
          content='Manage your stream overlay layouts and configurations'
        />
      </Head>
      <div className='min-h-screen bg-linear-to-br from-purple-900 via-blue-900 to-gray-900 text-white'>
        {/* Navigation Header */}
        <div className='sticky top-0 z-50'>
          <div className='max-w-7xl mx-auto py-2 px-4 sm:px-6 lg:px-8'>
            <div className='flex items-center justify-between h-16'>
              <div className='flex items-center gap-4'>
                <button
                  onClick={() => router.push('/')}
                  className='flex items-center gap-2 text-gray-300 hover:text-white transition-colors group'
                >
                  <svg
                    className='w-5 h-5 group-hover:-translate-x-1 transition-transform'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M10 19l-7-7m0 0l7-7m-7 7h18'
                    />
                  </svg>
                  <span className='font-medium'>Back to Home</span>
                </button>
              </div>

              <UserProfileDropdown />
            </div>
          </div>
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          {/* Profile Header */}
          <div className='mb-8'>
            <div className='flex flex-col sm:flex-row sm:items-center gap-6 mb-6'>
              <div className='flex items-center gap-4'>
                {session.user?.image && (
                  <div className='relative'>
                    <Image
                      src={session.user.image}
                      alt='Profile'
                      width={80}
                      height={80}
                      className='w-20 h-20 rounded-full border-4 border-purple-500/50 shadow-lg'
                    />
                    <div className='absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-gray-900'></div>
                  </div>
                )}
                <div>
                  <h1 className='text-4xl font-bold bg-linear-to-r from-white to-gray-300 bg-clip-text text-transparent'>
                    {session.user?.name}
                  </h1>
                  <p className='text-gray-400 text-lg'>
                    Stream Overlay Creator
                  </p>
                </div>
              </div>

              <div className='flex-1 sm:text-right'>
                <div className='bg-gray-800/50 backdrop-blur-sm rounded-2xl px-6 py-4 border border-gray-700/50'>
                  <div className='text-2xl font-bold text-purple-400'>
                    {layouts.length}
                  </div>
                  <div className='text-sm text-gray-400'>
                    {layouts.length === 1 ? 'Layout' : 'Layouts'} Created
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Controls */}
            <div className='flex flex-col sm:flex-row gap-4 mb-6'>
              <div className='flex-1'>
                <div className='relative'>
                  <svg
                    className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                    />
                  </svg>
                  <input
                    type='text'
                    placeholder='Search layouts by name or session ID...'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='w-full pl-10 pr-4 py-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all'
                  />
                </div>
              </div>

              <div className='flex gap-3'>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as 'name' | 'date')}
                  className='px-4 py-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all'
                >
                  <option value='date'>Sort by Date</option>
                  <option value='name'>Sort by Name</option>
                </select>

                <button
                  onClick={createNewLayout}
                  className='flex items-center gap-2 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl px-6 py-3 font-bold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105'
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
                      d='M12 4v16m8-8H4'
                    />
                  </svg>
                  New Layout
                </button>
              </div>
            </div>
          </div>

          {/* Layouts Content */}
          {filteredLayouts.length === 0 ? (
            <div className='text-center py-16'>
              {layouts.length === 0 ? (
                <div className='bg-linear-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-3xl p-12 border border-gray-700/30 max-w-2xl mx-auto'>
                  <div className='text-8xl mb-6 opacity-50'>🎨</div>
                  <h2 className='text-3xl font-bold mb-4 bg-linear-to-r from-white to-gray-300 bg-clip-text text-transparent'>
                    Create Your First Layout
                  </h2>
                  <p className='text-gray-400 text-lg mb-8 leading-relaxed'>
                    Welcome to Joeverlay! Start building amazing stream overlays
                    with our intuitive dashboard. Create interactive widgets,
                    customize colors, and make your stream stand out.
                  </p>
                  <button
                    onClick={createNewLayout}
                    className='bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl px-8 py-4 font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105'
                  >
                    Create Your First Layout
                  </button>
                </div>
              ) : (
                <div className='bg-linear-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-3xl p-12 border border-gray-700/30 max-w-lg mx-auto'>
                  <div className='text-6xl mb-4 opacity-50'>🔍</div>
                  <h2 className='text-2xl font-bold mb-2'>No layouts found</h2>
                  <p className='text-gray-400 mb-6'>
                    Try adjusting your search terms or create a new layout
                  </p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className='text-purple-400 hover:text-purple-300 font-medium transition-colors'
                  >
                    Clear search
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
              {filteredLayouts.map((layout, index) => (
                <div
                  key={layout.id}
                  className='group bg-linear-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-purple-500/50'
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className='mb-6'>
                    <div className='flex items-start justify-between mb-3'>
                      <h3 className='text-xl font-bold text-white group-hover:text-purple-200 transition-colors line-clamp-2'>
                        {layout.name}
                      </h3>
                      <div className='shrink-0 w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50'></div>
                    </div>

                    <div className='space-y-3 text-sm text-gray-400'>
                      <div className='flex items-center gap-2'>
                        <svg
                          className='w-4 h-4 text-purple-400'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M7 20l4-16m2 16l4-16M6 9h14M4 15h14'
                          />
                        </svg>
                        <code className='text-purple-300 bg-purple-900/30 px-2 py-1 rounded text-xs font-mono'>
                          {layout.sessionId}
                        </code>
                      </div>
                      <div className='flex items-center gap-2'>
                        <svg
                          className='w-4 h-4 text-blue-400'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                          />
                        </svg>
                        <span>Updated {formatDate(layout.updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className='flex gap-3'>
                    <button
                      onClick={() =>
                        router.push(`/dashboard/${layout.sessionId}`)
                      }
                      className='flex-1 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl px-4 py-3 font-bold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2'
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
                          d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                        />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        window.open(`/overlay/${layout.sessionId}`, '_blank')
                      }
                      className='bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 hover:border-gray-500/50 rounded-xl px-4 py-3 transition-all duration-200 flex items-center justify-center'
                      title='Preview overlay'
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
                          d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                        />
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(layout.id)}
                      disabled={deletingId === layout.id}
                      className='bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 hover:border-red-400/50 rounded-xl px-4 py-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
                      title='Delete layout'
                    >
                      {deletingId === layout.id ? (
                        <div className='animate-spin rounded-full h-4 w-4 border-2 border-red-400 border-t-transparent'></div>
                      ) : (
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
                            d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className='mt-16'>
            <Footer />
          </div>
        </div>
      </div>
    </>
  );
}
