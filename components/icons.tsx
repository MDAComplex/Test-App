type IconProps = {
  className?: string;
  filled?: boolean;
};

export function HeartIcon({ className, filled }: IconProps) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 21s-7.5-4.6-10.2-9.3C0.2 8.7 1.3 5 4.8 4.1c2-.5 3.9.3 5.2 1.9 1.3-1.6 3.2-2.4 5.2-1.9 3.5.9 4.6 4.6 3 7.6C19.5 16.4 12 21 12 21z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 21s-7.5-4.6-10.2-9.3C0.2 8.7 1.3 5 4.8 4.1c2-.5 3.9.3 5.2 1.9 1.3-1.6 3.2-2.4 5.2-1.9 3.5.9 4.6 4.6 3 7.6C19.5 16.4 12 21 12 21z" />
    </svg>
  );
}

export function ShopBagIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 8h12l1.2 12.2a1 1 0 0 1-1 1.1H5.8a1 1 0 0 1-1-1.1L6 8z" />
      <path d="M9 11V6a3 3 0 0 1 6 0v5" />
    </svg>
  );
}

export function ShareIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}

export function StarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.5l2.9 6 6.6.6-5 4.4 1.5 6.5L12 16.8 6 20l1.5-6.5-5-4.4 6.6-.6z" />
    </svg>
  );
}

export function FeedIcon({ className, filled }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4" y="3" width="16" height="18" rx="3" fill={filled ? "currentColor" : "none"} />
      <path d="M9 9.5l5.5 3-5.5 3v-6z" fill={filled ? "black" : "currentColor"} stroke="none" />
    </svg>
  );
}

export function UserIcon({ className, filled }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="8" r="3.5" fill={filled ? "currentColor" : "none"} />
      <path d="M4.5 20c1.2-3.5 4.2-5.5 7.5-5.5s6.3 2 7.5 5.5" fill={filled ? "currentColor" : "none"} />
    </svg>
  );
}
