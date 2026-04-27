import Image from 'next/image';

export default function Logo({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
    '2xl': 'w-40 h-40',
  };
  return (
    <Image
      src="/APL.png"
      alt="APL Season 8"
      width={160}
      height={160}
      priority
      loading="eager"
      className={`${sizes[size]} object-contain ${className}`}
    />
  );
}
