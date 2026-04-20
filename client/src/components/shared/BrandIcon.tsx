// Brand icons for preset groups (WeChat LiCaiTong & Alipay)
import iconLicaitong from '@/assets/icon-licaitong.png';
import iconAlipayFund from '@/assets/icon-alipay-fund.png';

interface BrandIconProps {
  groupId: string;
  fallbackIcon: string;
  size?: number;
}

export default function BrandIcon({ groupId, fallbackIcon, size = 24 }: BrandIconProps) {
  if (groupId === 'licaitong') {
    return <img src={iconLicaitong} width={size} height={size} alt="理财通" className="inline-block" />;
  }

  if (groupId === 'alipay') {
    return <img src={iconAlipayFund} width={size} height={size} alt="支付宝" className="inline-block" />;
  }

  // Fallback to emoji
  return <span className="text-lg">{fallbackIcon}</span>;
}
