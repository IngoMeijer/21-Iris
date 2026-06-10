export default function BinnenboomMark({
  size = 32,
  className = '',
  accent = '#cd7f57',
}) {
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
      {/* trunk */}
      <path
        d="M32 60 V44"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.55"
      />
      {/* branches reaching to the side leaves */}
      <path
        d="M32 46 C28 40 24 36 22 32"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M32 46 C36 40 40 36 42 32"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
      {/* left leaf */}
      <path
        d="M22 32 C16 28 14 22 18 16 C24 20 26 26 22 32 Z"
        fill="currentColor"
        opacity="0.5"
      />
      {/* right leaf */}
      <path
        d="M42 32 C48 28 50 22 46 16 C40 20 38 26 42 32 Z"
        fill="currentColor"
        opacity="0.5"
      />
      {/* top leaf, mirrored pair */}
      <path
        d="M32 22 C28 18 26 10 30 6 C34 12 36 16 32 22 Z"
        fill="currentColor"
        opacity="0.6"
      />
      <path
        d="M32 22 C36 18 38 10 34 6 C30 12 28 16 32 22 Z"
        fill="currentColor"
        opacity="0.75"
      />
      {/* heart in the middle */}
      <path
        d="M32 40 C28 36 24 33 24 29 C24 27 26 25.5 28 25.5 C30 25.5 31 26.5 32 28 C33 26.5 34 25.5 36 25.5 C38 25.5 40 27 40 29 C40 33 36 36 32 40 Z"
        fill={accent}
      />
    </svg>
  )
}
