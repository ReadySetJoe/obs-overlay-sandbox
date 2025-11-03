// components/dashboard/ToggleSwitch.tsx
'use client';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  color?: string;
  label?: string;
}

export default function ToggleSwitch({
  checked,
  onChange,
  color = 'green',
  label,
}: ToggleSwitchProps) {
  return (
    <div className='flex items-center gap-2'>
      {label && <span className='text-xs text-gray-500'>{label}</span>}
      <button
        onClick={e => {
          e.stopPropagation();
          onChange();
        }}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
          checked ? `bg-${color}-500` : 'bg-gray-600'
        }`}
        aria-label={label || 'Toggle'}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
