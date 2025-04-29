"use client";
import React from "react";
import Link from "next/link";
import { cn } from "@kit/ui/utils";

interface SettingsBreadcrumbProps {
  breadcrumbs: { label: string; href: string }[];
  displayName: string;
  actionButtons?: React.ReactNode;
}

export default function SettingsBreadcrumb({
  breadcrumbs,
  displayName,
  actionButtons,
}: SettingsBreadcrumbProps) {
  return (
    <div className="mb-4">
      <div>
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/settings" className="text-muted-foreground hover:text-primary font-medium transition-colors">
                Settings
              </Link>
            </li>
            {breadcrumbs.map((crumb, idx) => (
              <li key={crumb.href} className="flex items-center">
                <svg className="mx-2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <Link
                  href={crumb.href}
                  className={cn(
                    "text-muted-foreground hover:text-primary font-medium transition-colors",
                    idx === breadcrumbs.length - 1 && "pointer-events-none text-primary"
                  )}
                  aria-current={idx === breadcrumbs.length - 1 ? "page" : undefined}
                >
                  {crumb.label}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      </div>
      <div className="mt-2 md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg/7 font-bold text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {displayName}
          </h2>
        </div>
        {actionButtons && (
          <div className="mt-4 flex shrink-0 md:mt-0 md:ml-4">
            {actionButtons}
          </div>
        )}
      </div>
    </div>
  );
}