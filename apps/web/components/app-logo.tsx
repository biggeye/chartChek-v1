import Link from 'next/link';

import { cn } from '@kit/ui/utils';

function LogoImage({
  className,
  width = 105,
}: {
  className?: string;
  width?: number;
}) {
  return (
    <svg
    width={width}
    className={cn('', className)}
    viewBox="0 0 1261.29 857.73" 
    fill="#004fa3" 
    xmlns="http://www.w3.org/2000/svg"
  >
   <path d="M773.51.34C587.25.34,0-26.22,0,386.9c0,491.75,555.94,470.7,671.86,470.7,9.7,0,10.29-38.16,9.67-55.23-.65-18.25-.54-73.57-10.3-73.57-138.86-1.08-525.04-8.67-525.04-339.21,0-261.42,441.86-253.01,573.56-253.01"/>
<path d="M1249.38,126.47c-.09-.08-.19-.14-.3-.18C761.91-87.82,926.98-12.65,630.45,478.59c-69.25,114.74,20.13,146.75,30.71,148.16.72.09,1.39-.37,1.54-1.07,22.65-99.05-110.02-345.8-208.97-388.25-24.08-10.33-133.4,15.69-149.36,35.18-.5.61-1.27.86-1.16,1.65,7.44,50.18,248.93,170.63,234.37,371.49-.01.16,68.71,13.11,109.52,6.68,2.84-.45,5.69-.71,7.67-2.79,14.91-15.61,71.67-92.14,154.96-233.4,177.19-300.55,318.88-308.03,387.88-292.81,1.84.41,44.27,14.01,46.13,14.58,19.77,6.18,24.46-3.3,5.63-11.54h0Z"/>
</svg>
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

