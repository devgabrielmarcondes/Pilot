"use client";

import { BarChart3, LayoutDashboard, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      <nav className="topnav">
        <div className="topnav-left">
          <Link className="topnav-brand" href="/">
            SAM<span>Y</span>
          </Link>
          <div className="topnav-links">
            <Link className={pathname === "/" ? "topnav-link active" : "topnav-link"} href="/">
              Workspace
            </Link>
            <Link
              className={pathname === "/evaluations" ? "topnav-link active" : "topnav-link"}
              href="/evaluations"
            >
              Evaluations
            </Link>
          </div>
        </div>
        <div className="topnav-right">
          <Button
            className="mobile-toggle"
            size="icon"
            variant="ghost"
            type="button"
            aria-label="Toggle brief panel"
            onClick={() => document.querySelector(".sidebar")?.classList.toggle("open")}
          >
            <Menu size={16} />
          </Button>
          <div className="topnav-avatar">GM</div>
        </div>
      </nav>
      <nav className="mobile-tabbar" aria-label="Mobile navigation">
        <Link className={pathname === "/" ? "active" : ""} href="/">
          <LayoutDashboard size={16} />
          <span>Workspace</span>
        </Link>
        <Link className={pathname === "/evaluations" ? "active" : ""} href="/evaluations">
          <BarChart3 size={16} />
          <span>Evaluations</span>
        </Link>
      </nav>
    </>
  );
}
