'use client'
import dynamic from 'next/dynamic';
import { useState, useEffect, useRef, Fragment } from 'react'
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@kit/shared/utils';  // Updated path
import { signOutAction } from '~/lib/server/actions';    // Updated path (assuming location)
import { ThemeSwitcher } from '~/components/modules/theme-switcher';
import { LoadingBar } from '~/components/ui/loading-bar';
import { initializeStoreSubscriptions } from '~/store/storeInitializers';
import Image from 'next/image';
import { DebugPanel } from '~/components/dev/DebugPanel';

import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition
} from '@headlessui/react'
import {
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline'
import {
  BuildingOffice2Icon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import { BookIcon, BuildingIcon, ChartAreaIcon, PieChartIcon } from 'lucide-react';
import ChevronDownIcon from '@heroicons/react/24/solid/ChevronDownIcon';
import { ChatBubbleBottomCenterIcon } from '@heroicons/react/24/outline';



interface AppLayoutProps {
  children: React.ReactNode;
  user_id: string;
}

export default function AppLayout({ children, user_id }: AppLayoutProps) {
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [showInsights, setShowInsights] = useState(true);
  const pathname = usePathname();
  const FacilitySelector = dynamic(
    () => import('~/components/modules/facility-selector').then(mod => ({ default: mod.FacilitySelector })),
    { ssr: false }
  );
  // Navigation items
  const navigation = [
    { name: 'Home', href: '/protected', icon: BuildingOffice2Icon },
    { name: 'Chat', href: '/protected/chat', icon: ChatBubbleBottomCenterIcon },
    { name: 'Patients', href: '/protected/patients', icon: UserCircleIcon },
    { name: 'Documents', href: '/protected/documents', icon: DocumentDuplicateIcon },
    { name: 'Statistics', href: '/protected/dashboard/stats', icon: PieChartIcon },
  
      ].map(item => ({
    ...item,
    current: pathname === item.href
  }));

  // User dropdown items
  const userNavigation = [
    { name: 'Your Profile', href: '/protected/account' },
    { name: 'Facility Settings', href: '/protected/settings' },
    { name: 'Sign out', href: '#', onClick: async () => await signOutAction() },
  ];

  function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
  }

  useEffect(() => {
    const handleScroll = () => {
      const st = window.pageYOffset || document.documentElement.scrollTop;
      if (st > lastScrollTop && st > 150) {
        // Scrolling down and past threshold, hide insights
        setShowInsights(false);
      } else if (st < lastScrollTop || st < 50) {
        // Scrolling up or near top, show insights
        setShowInsights(true);
      }
      setLastScrollTop(st <= 0 ? 0 : st);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollTop]);

  // Initialize cross-store subscriptions
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // First initialize facility data
        const { initializeFacilityData } = require('~/store/storeInitializers');
        await initializeFacilityData();

        // Then initialize all store subscriptions
        const cleanup = initializeStoreSubscriptions();

        // Return cleanup function to unsubscribe when component unmounts
        return cleanup;
      } catch (error) {
        console.error('Error initializing app:', error);
        return () => { };
      }
    };

    // Initialize and store the cleanup function
    let cleanup: (() => void) | undefined;
    initializeApp().then(cleanupFn => {
      cleanup = cleanupFn;
    });

    // Return cleanup function
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <div className="min-h-screen max-h-screen bg-background">
      <LoadingBar />
      <div className="sticky top-0 z-40 flex sm:h-10 md:h-12 7xl:h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
        <div className="flex flex-1 gap-x-2 self-stretch lg:gap-x-4">
          <div className="flex flex-1 items-center">
            {/* Logo/Brand */}
            <Link href="/protected" className="flex items-center gap-0.5">
              <Image src="/logos/logo.png" width="40" height="40" alt="chartChek" />

            </Link>
          </div>

          <div className="flex items-center gap-x-2 lg:gap-x-6">
            {/* Facility Selector */}
            <FacilitySelector />

            {/* User dropdown */}
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <Menu as="div" className="relative inline-block text-left">
                <MenuButton className="flex items-center gap-x-2 text-sm font-medium text-foreground hover:text-foreground-muted">
                  <UserCircleIcon className="h-6 w-6 text-foreground-muted" aria-hidden="true" />

                  <ChevronDownIcon className="h-5 w-5 text-foreground-muted" aria-hidden="true" />
                </MenuButton>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <MenuItems className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-background shadow-lg ring-1 ring-border ring-opacity-5 focus:outline-none">
                    {/* Navigation section */}
                    <div className="py-1">
                      {navigation.map((item) => (
                        <MenuItem key={item.name}>
                          {({ active }) => (
                            <Link
                              href={item.href}
                              className={cn(
                                active ? 'bg-muted text-foreground' : 'text-foreground-muted',
                                item.current ? 'bg-muted/50 font-medium' : '',
                                'flex items-center px-4 py-2 text-sm'
                              )}
                            >
                              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                              {item.name}
                            </Link>
                          )}
                        </MenuItem>
                      ))}
                    </div>

                    {/* User settings section */}
                    <div className="py-1">
                      <MenuItem>
                        {({ active }) => (
                          <Link
                            href="/protected/account"
                            className={cn(
                              active ? 'bg-muted text-foreground' : 'text-foreground-muted',
                              'block px-4 py-2 text-sm'
                            )}
                          >
                            Your Profile
                          </Link>
                        )}
                      </MenuItem>
                      <MenuItem>
                        {({ active }) => (
                          <Link
                            href="/protected/settings"
                            className={cn(
                              active ? 'bg-muted text-foreground' : 'text-foreground-muted',
                              'block px-4 py-2 text-sm'
                            )}
                          >
                            Facility Settings
                          </Link>
                        )}
                      </MenuItem>
                      <MenuItem>
                        {({ active }) => (
                          <div
                            className={cn(
                              active ? 'bg-muted text-foreground' : 'text-foreground-muted',
                              'block px-4 py-2 text-sm'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span>Theme</span>
                              <ThemeSwitcher />
                            </div>
                          </div>
                        )}
                      </MenuItem>
                      <MenuItem>
                        {({ active }) => (
                          <button
                            onClick={async () => await signOutAction()}
                            className={cn(
                              active ? 'bg-muted text-foreground' : 'text-foreground-muted',
                              'block w-full text-left px-4 py-2 text-sm'
                            )}
                          >
                            Sign out
                          </button>
                        )}
                      </MenuItem>
                    </div>
                  </MenuItems>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>
      </div>
      <main className="flex-1 maxw-screen">
        {children}
      </main>
      <DebugPanel />
    </div>

  )
}
