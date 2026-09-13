// components/overlay/ConnectionStatus.tsx

interface ConnectionStatusProps {
  isConnected: boolean;
}

/**
 * Disconnected badge for overlay pages.
 *
 * Previously this markup was copy-pasted into 12 of the 13 overlay pages, which is
 * why the reconnect hint lives here: one place to change.
 */
export default function ConnectionStatus({
  isConnected,
}: ConnectionStatusProps) {
  if (isConnected) return null;

  return (
    <div
      data-testid='connection-status'
      className='fixed top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50'
    >
      <div className='font-semibold'>Disconnected</div>
      <div className='text-xs text-red-100 mt-0.5'>
        Try toggling browser source visibility to reconnect
      </div>
    </div>
  );
}
