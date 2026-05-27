export default function BinnenboomMark({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M32 54 V36" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
      <path
        d="M32 40 C22 36, 17 26, 22 16 C30 20, 35 28, 32 40 Z"
        fill="currentColor"
        opacity="0.45"
      />
      <path
        d="M32 40 C42 36, 47 26, 42 16 C34 20, 29 28, 32 40 Z"
        fill="currentColor"
        opacity="0.75"
      />
      <circle cx="32" cy="36" r="1.6" fill="currentColor" />
    </svg>
  )
}
