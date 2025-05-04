"use client";
import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import SettingsBreadcrumb from "~/components/settings/SettingsBreadcrumb";

// Friendly names for breadcrumbs and nav
const FRIENDLY_LABELS: Record<string, string> = {
  compliance: "Compliance",
  evaluations: "Evaluations",
  profile: "Profile",
  users: "Users",
  overview: "Overview",
};

const NAV_ITEMS = [
  { name: "User Profile", href: "/product/settings/userProfile" },
  { name: "KIPU", href: "/product/settings/kipu" },
  { name: "Compliance", href: "/product/settings/compliance" },
  { name: "AI", href: "/products/settings/ai" }
];

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const settingsIdx = segments.indexOf("settings");
  if (settingsIdx === -1) return [];
  const crumbs = segments.slice(settingsIdx + 1);
  let href = "/product/settings";
  return crumbs.map((seg) => {
    if (!seg) return { label: "Unknown", href };
    href += `/${seg}`;
    return {
      label: FRIENDLY_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1),
      href,
    };
  });
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);
  const displayName = "Settings"

  // Determine active nav item
  const activeNav = (href: string) =>
    pathname === href || (href !== "/product/settings" && pathname.startsWith(href));

  return (
    <div className="flex flex-col bg-background">
      <SettingsBreadcrumb breadcrumbs={breadcrumbs} displayName={displayName} />
      <div className="flex flex-1">
        
        {/* Main content */}
        {children}
      </div>
    </div>
  );
}