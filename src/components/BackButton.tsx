import Link from 'next/link'

const BackIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-8 w-8"
    fill="none"
    viewBox="0 0 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
)

export const BackButton = ({
  href = '/',
  className,
}: {
  href?: string
  className?: string
}) => {
  return (
    <Link href={href} className={className}>
      <BackIcon />
    </Link>
  )
} 