"use client";

import * as React from "react";
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { cn } from "~/lib/utils";

interface DropdownMenuProps {
  items: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  }[];
  triggerIcon?: React.ReactNode;
  triggerLabel?: string;
  className?: string;
  align?: "left" | "right";
  position?: "top" | "bottom";
}

const DropdownMenu = ({
  items,
  triggerIcon,
  triggerLabel,
  className,
  align = "right",
  position = "bottom"
}: DropdownMenuProps) => {
  return (
    <Menu as="div" className={cn("relative inline-block text-left", className)}>
      <div>
        <Menu.Button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
          {triggerIcon}
          {triggerLabel && <span className="ml-2">{triggerLabel}</span>}
          {!triggerIcon && !triggerLabel && (
            <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
          )}
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className={cn(
          "absolute z-50 w-56 rounded-md border bg-white p-1 shadow-md focus:outline-none",
          position === "top" && "bottom-full mb-2",
          position === "bottom" && "top-full mt-2",
          align === "left" && "left-0",
          align === "right" && "right-0"
        )}>
          <div className="py-1">
            {items.map((item, index) => (
              <Menu.Item key={index}>
                {({ active }) => (
                  <button
                    onClick={item.onClick}
                    className={cn(
                      "flex w-full items-center px-3 py-2 text-sm rounded-md",
                      active ? "bg-accent text-accent-foreground" : "text-foreground"
                    )}
                  >
                    {item.icon && <span className="mr-2">{item.icon}</span>}
                    {item.label}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default DropdownMenu;
