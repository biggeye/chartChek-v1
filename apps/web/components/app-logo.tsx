import Link from 'next/link';
import Image from 'next/image';

import { cn } from '@kit/ui/utils';

function LogoImage({
  className,
  width = 105,
}: {
  className?: string;
  width?: number;
}) {
  return (
    <Image
      width={width}
      height={width * (857.73 / 1261.29)}
      className={cn('', className)}
      src="/images/favicon/chartChek-solid.svg"
      alt="ChartChek Logo"
    />
  );
}


export function AppLogo({
  href,
  label,
  className,
}: {
  href?: string | null;
  className?: string;
  label?: string;
}) {
  if (href === null) {
    return <LogoImage className={className} />;
  }

  return (
    <Link aria-label={label ?? 'Home Page'} href={href ?? '/'}>
      <LogoImage className={className} />
    </Link>
  );
}
