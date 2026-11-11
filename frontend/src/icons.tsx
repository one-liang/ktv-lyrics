type P = { size?: number }

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

export const PlayIcon = ({ size = 20 }: P) => (
  <svg {...base(size)}>
    <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
  </svg>
)

export const PauseIcon = ({ size = 20 }: P) => (
  <svg {...base(size)}>
    <path d="M8.5 5.5v13M15.5 5.5v13" strokeWidth={3} />
  </svg>
)

export const BackIcon = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <path d="M14.5 6l-6 6 6 6" />
  </svg>
)

export const CloseIcon = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
  </svg>
)

export const MinusIcon = ({ size = 16 }: P) => (
  <svg {...base(size)}>
    <path d="M6 12h12" />
  </svg>
)

export const PlusIcon = ({ size = 16 }: P) => (
  <svg {...base(size)}>
    <path d="M6 12h12M12 6v12" />
  </svg>
)

export const FullscreenIcon = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <path d="M4.5 9V4.5H9M15 4.5h4.5V9M19.5 15v4.5H15M9 19.5H4.5V15" />
  </svg>
)

export const SearchIcon = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4 4" />
  </svg>
)
