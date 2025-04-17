'use client';

import { ReactNode } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: ReactNode;
  actions: ReactNode;
}

export default function Modal({ isOpen, onClose, title, content, actions }: ModalProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-10 w-full">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
      />

      <div className="fixed inset-0 z-10 w-3/4 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-lg bg-gradient-to-b from-white to-white/95 dark:from-gray-900 dark:to-gray-900/95 px-4 pt-5 pb-4 text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 w-3/4 max-w-none sm:p-6 data-closed:sm:translate-y-0 data-closed:sm:scale-95"
          >
            <div>
              <div className="mt-3 text-center sm:mt-5">
                <DialogTitle as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 bg-gradient-to-r from-transparent via-gray-100/10 dark:via-gray-800/10 to-transparent py-2">
                  {title}
                </DialogTitle>
                <div className="mt-2">
                  {content}
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
              {actions}
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
