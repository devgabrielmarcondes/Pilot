"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const appHref = "/app" as never;

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="topnav">
      <div className="topnav-left">
        <Link className="topnav-brand" href={appHref}>
          <img src="/pilot-logo.png" alt="Pilot" width={28} height={28} />
        </Link>
        <div className="topnav-links">
          <Link
            className={pathname === "/app" || pathname.startsWith("/campaigns") ? "topnav-link active" : "topnav-link"}
            href={appHref}
          >
            Campaigns
          </Link>
        </div>
      </div>
      <div className="topnav-right">
        <div className="topnav-avatar">GM</div>
      </div>
    </nav>
  );
}
