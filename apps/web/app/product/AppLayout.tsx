'use client'
import dynamic from 'next/dynamic';
import { useState, useEffect, useRef, Fragment, useCallback, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@kit/ui/utils';
import { signOutAction } from '../../lib/actions';
import { ThemeSwitcher } from '~/components/theme-switcher';
import { useSidebarStore } from '~/store/sidebarStore';
import { usePatientStore } from '~/store/patient/patientStore';
import { FileLockIcon } from 'lucide-react';
import Image from 'next/image';
import { DebugPanel } from '~/components/dev/DebugPanel';
import { Dialog, DialogBackdrop, DialogPanel, TransitionChild, Menu, MenuItem, MenuItems, Transition, MenuButton } from '@headlessui/react'
import {
  Bars3Icon,
  CalendarIcon,
  ChartPieIcon,
  DocumentDuplicateIcon,
  FolderIcon,
  HomeIcon,
  PaperClipIcon,
  UsersIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserCircleIcon,
  ChatBubbleBottomCenterIcon
} from '@heroicons/react/24/outline'
import { Avatar, AvatarFallback, AvatarImage } from "@kit/ui/avatar";
import { AppLogo } from '~/components/app-logo';
import { Loader } from '~/components/loading';
import { useFetchPatientsOnFacilityChange } from '~/hooks/usePatients';

import { FacilitySelector } from '~/components/facility-selector';
import Loading from '~/admin/loading';
import { ChatHistory } from '~/components/chat/chat-history';

const navigation = [
  { name: 'Dashboard', href: '#', icon: HomeIcon },
  { name: 'Chat', href: '/product/chat', icon: ChatBubbleBottomCenterIcon },
  { name: 'Patients', href: '/product/patients', icon: UsersIcon },
  { name: 'Documents', href: '/product/documents', icon: FolderIcon },
  { name: 'Records', href: '/product/records', icon: FileLockIcon },
]

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

// Define Props interface
interface AppLayoutProps {
  children: React.ReactNode;
  account_id: string;
  username: string;
  avatarUrl: string | null;
}

export default function AppLayout({
  children,
  account_id,
  username,
  avatarUrl
}: AppLayoutProps) {
  const isLoadingPatients = usePatientStore(useCallback(state => state.isLoadingPatients, []));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const { isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed } = useSidebarStore();

  const pathname = usePathname();

  const PatientLoader = useMemo(() => {
    const PatientsComponent = () => {
      useFetchPatientsOnFacilityChange();
      return null;
    };
    // Only return the component if not loading facilities
    return !isLoadingPatients ? <PatientsComponent /> : null;
  }, []);


  return (
    <>
      {/* Render the PatientLoader component */}
      {PatientLoader}

      {/* Chat History Dialog for mobile */}
      <Dialog open={showChatHistory} onClose={() => setShowChatHistory(false)} className="relative z-50">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-300 ease-linear data-closed:opacity-0"
        />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-background p-6 text-left align-middle shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Chat History</h3>
                <button
                  type="button"
                  onClick={() => setShowChatHistory(false)}
                  className="rounded-full p-1 text-foreground-muted hover:bg-muted transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <ChatHistory isMobileMenu onMobileMenuClose={() => setShowChatHistory(false)} />
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      <div>
        <Dialog open={sidebarOpen} onClose={setSidebarOpen} className="relative z-50 lg:hidden">
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-indigo_dye-500/80 transition-opacity duration-300 ease-linear data-closed:opacity-0"
          />

          <div className="fixed inset-0 flex">
            <DialogPanel
              transition
              className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full border-r border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75"
            >
              <TransitionChild>
                <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
                  <button type="button" onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5 text-white">
                    <span className="sr-only ">Close sidebar</span>
                    <XMarkIcon aria-hidden="true" className="size-6" />
                    {/* NOTE: text-white kept for explicit contrast on dark backdrop */}
                  </button>
                </div>
              </TransitionChild>
              {/* Sidebar component, swap this element with another sidebar if you like */}
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-accent/20 px-6 pb-2">
                <div className="flex h-16 shrink-0 items-center">
                  <AppLogo className="h-8 w-auto" />
                </div>
                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {navigation.map((item) => {
                          const isActive = item.href === '#' ? pathname === '/product' : pathname.startsWith(item.href);

                          return (
                            <li key={item.name}>
                              <Link
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={classNames(
                                  isActive
                                    ? 'bg-mint_green-600 text-primary dark:bg-indigo_dye-400 dark:text-primary'
                                    : 'text-indigo_dye-400 hover:bg-mint_green-700 hover:text-primary dark:text-mint_green-700 dark:hover:bg-indigo_dye-300 dark:hover:text-primary',
                                  'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                                )}
                              >
                                <item.icon
                                  aria-hidden="true"
                                  className={classNames(
                                    isActive ? 'text-primary dark:text-primary' : 'text-indigo_dye-300 group-hover:text-primary dark:text-mint_green-700 dark:group-hover:text-primary',
                                    'size-6 shrink-0',
                                  )}
                                />
                                {item.name}
                              </Link>
                            </li>
                          )
                        })
                        }
                      </ul>
                    </li>
                    <li>
                      <div className="text-xs/6 font-semibold text-muted-foreground dark:text-muted-foreground">Facility</div>
                      <FacilitySelector onSelect={() => setSidebarOpen(false)} />
                    </li>
                  </ul>
                  <Avatar>

                  </Avatar>
                </nav>
              </div>
            </DialogPanel>
          </div>
        </Dialog>

        <div className="flex items-center justify-between px-4 py-4 shadow-sm border-b border-border bg-background dark:border-border sm:px-6 lg:hidden">
          <button type="button" onClick={() => setSidebarOpen(true)} className="-m-2.5 p-2.5 text-muted-foreground dark:text-muted-foreground">
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon aria-hidden="true" className="h-6 w-6" />
          </button>

          <Menu as="div" className="relative">
            <MenuButton className="-m-1.5 flex items-center p-1.5 hover:opacity-80">
              <span className="sr-only">Open user menu</span>
              <Avatar className="h-8 w-8 rounded-full bg-secondary text-muted-foreground dark:bg-secondary dark:text-muted-foreground">
                <AvatarImage src={avatarUrl || undefined} alt="User Avatar" />
                <AvatarFallback className="text-xs">
                  {username ? username.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
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
              <MenuItems className="absolute right-0 z-10 mt-2.5 w-48 origin-top-right rounded-md bg-popover py-2 shadow-lg ring-1 ring-foreground/5 focus:outline-none dark:bg-popover dark:ring-foreground/10">
                <MenuItem>
                  {({ focus }) => (
                    <Link
                      href="/product/settings" // Example link, adjust as needed
                      className={cn(
                        focus ? 'bg-accent dark:bg-accent' : '',
                        'block px-3 py-1 text-sm leading-6 text-popover-foreground dark:text-popover-foreground'
                      )}
                    >
                      Your Profile
                    </Link>
                  )}
                </MenuItem>
                <MenuItem>
                  {({ focus }) => (
                    <button
                      type="button"
                      onClick={() => {
                        setShowChatHistory(true);
                      }}
                      className={cn(
                        focus ? 'bg-accent dark:bg-accent' : '',
                        'block w-full px-3 py-1 text-left text-sm leading-6 text-popover-foreground dark:text-popover-foreground'
                      )}
                    >
                      Chat History
                    </button>
                  )}
                </MenuItem>
                <div className="my-1 h-px bg-border dark:bg-border" />
                <MenuItem>
                  {({ focus }) => (
                    <div
                      className={cn(
                        focus ? 'bg-accent dark:bg-accent' : '',
                        'flex w-full items-center justify-between px-3 py-1 text-sm leading-6 text-popover-foreground dark:text-popover-foreground'
                      )}
                    >
                      <span>Theme</span>
                      <div className="-mr-1">
                        <ThemeSwitcher />
                      </div>
                    </div>
                  )}
                </MenuItem>
                <div className="my-1 h-px bg-border dark:bg-border" />
                <MenuItem>
                  {({ focus }) => (
                    <form action={signOutAction} className="w-full">
                      <button
                        type="submit"
                        className={classNames(
                          focus ? 'bg-accent dark:bg-accent' : '',
                          'block w-full px-3 py-1 text-left text-sm leading-6 text-popover-foreground dark:text-popover-foreground'
                        )}
                      >
                        Sign out
                      </button>
                    </form>
                  )}
                </MenuItem>
              </MenuItems>
            </Transition>
          </Menu>
        </div>
        <div
          className={cn(
            'hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300 ease-in-out relative', // Added relative positioning
            isDesktopSidebarCollapsed ? 'lg:w-20' : 'lg:w-72'
          )}
        >

          <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-border bg-background px-6 pb-4">
            <div className="flex h-16 shrink-0 items-center">
              <AppLogo className="h-14" />

            </div>
            {!isDesktopSidebarCollapsed && (
              <FacilitySelector variant='sidebar' />
            )}
            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="-mx-2 space-y-1">
                    {navigation.map((item) => {
                      const isActive = item.href === '#' ? pathname === '/product' : pathname.startsWith(item.href);

                      return (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            className={classNames(
                              isActive
                                ? 'bg-mint_green-600 text-primary dark:bg-indigo_dye-400 dark:text-primary'
                                : 'text-indigo_dye-400 hover:bg-mint_green-700 hover:text-primary dark:text-mint_green-700 dark:hover:bg-indigo_dye-300 dark:hover:text-primary',
                              'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                            )}
                          >
                            <item.icon
                              aria-hidden="true"
                              className={classNames(
                                isActive ? 'text-primary dark:text-primary' : 'text-indigo_dye-300 group-hover:text-primary dark:text-mint_green-700 dark:group-hover:text-primary',
                                'size-6 shrink-0',
                              )}
                            />
                            {!isDesktopSidebarCollapsed && <span className="truncate">{item.name}</span>}
                          </Link>
                        </li>
                      )
                    })
                    }
                  </ul>
                </li>
              </ul>
            </nav>
            {!isDesktopSidebarCollapsed && (
              <ul role="list" className="mt-auto">
                <li className="-mx-6">
                  <Link
                    href="/product/settings" // Updated href from /product/profile
                    className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-foreground hover:bg-accent"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Your profile picture" className="h-8 w-8 rounded-full bg-secondary object-cover" />
                    ) : (
                      <UserCircleIcon className="h-8 w-8 rounded-full bg-secondary text-muted-foreground" />
                    )}
                    <span className="sr-only">Your profile</span>
                    <span aria-hidden="true">{username}</span>
                  </Link>
                </li>
              </ul>
            )}
          </div>
          {!isDesktopSidebarCollapsed && (
            <button
              onClick={() => setIsDesktopSidebarCollapsed(true)}
              className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2 z-50 bg-background border border-border rounded-full p-1.5 shadow-md hover:bg-accent"
            >
              <span className="sr-only">Collapse Sidebar</span>
              <ChevronLeftIcon className="h-5 w-5 text-foreground" />
            </button>
          )}
          {isDesktopSidebarCollapsed && (
            <button
              onClick={() => setIsDesktopSidebarCollapsed(false)}
              className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2 z-50 bg-background border border-border rounded-full p-1.5 shadow-md hover:bg-accent"
            >
              <span className="sr-only">Expand Sidebar</span>
              <ChevronRightIcon className="h-5 w-5 text-foreground" />
            </button>
          )}
        </div>
  
          <main className={cn(
            'transition-all duration-3000 ease-in-out bg-background h-[90vh] pt-5',
            isDesktopSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
          )}>
            <div className="h-[calc(100%-4rem)] lg:h-full px-4 sm:px-6 lg:px-8">{children}</div>
          </main>
      </div>
    </>
  )
}
