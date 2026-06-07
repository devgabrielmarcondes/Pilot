import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mx-auto grid min-h-[360px] max-w-xl place-items-center border border-black/12 rounded-[8px] p-8 text-center">
      <div>
        <div className="mx-auto mb-5 grid size-11 place-items-center rounded-full bg-[#7C3AED]/10 text-[#7C3AED]">
          <Icon size={22} />
        </div>
        <h1 className="font-display text-2xl font-semibold">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-black/55">{description}</p>
        {actionLabel && onAction ? (
          <Button className="mt-6" type="button" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
