// Brand icons for preset groups (WeChat LiCaiTong & Alipay)
// Returns an SVG element or emoji fallback

interface BrandIconProps {
  groupId: string;
  fallbackIcon: string;
  size?: number;
}

export default function BrandIcon({ groupId, fallbackIcon, size = 24 }: BrandIconProps) {
  if (groupId === 'licaitong') {
    // WeChat green icon
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" rx="12" fill="#07C160"/>
        <path d="M32.8 21.2c-.3 0-.5 0-.8.1-.8-4.2-4.8-7.3-9.5-7.3-5.3 0-9.5 3.8-9.5 8.5 0 2.7 1.4 5.1 3.7 6.7l-.9 2.8 3.2-1.6c1 .3 2.1.5 3.2.5h.3c-.1-.5-.1-1-.1-1.5.1-4.5 4.3-8.2 9.5-8.2h.9z" fill="white"/>
        <path d="M28.3 30.5c3.8 0 6.9-2.7 6.9-6s-3.1-6-6.9-6-6.9 2.7-6.9 6 3.1 6 6.9 6z" fill="white" fillOpacity="0.3"/>
        <circle cx="20" cy="20.5" r="1.2" fill="#07C160"/>
        <circle cx="25.5" cy="20.5" r="1.2" fill="#07C160"/>
      </svg>
    );
  }

  if (groupId === 'alipay') {
    // Alipay blue icon
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" rx="12" fill="#1677FF"/>
        <path d="M33.5 28.8c-2.2-.8-4.8-1.9-6.4-2.7 1.3-2 2.2-4.4 2.7-7h-5.6v-2.3h7V15h-7v-3h-3v3h-7v1.8h7v2.3h-5.8v1.8h10.8c-.4 1.8-1.1 3.5-2 5-1.5-.7-3.2-1.3-5-1.6-3.2-.6-5.5.5-6 2.5-.5 2 .8 4.2 4.3 4.8 2.3.4 5-.3 6.8-2.1 1.8 1 4.4 2.2 7.2 3.3l2.5-4z" fill="white"/>
      </svg>
    );
  }

  // Fallback to emoji
  return <span className="text-lg">{fallbackIcon}</span>;
}
