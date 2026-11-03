import * as React from "react";
import Link from "next/link";
import { FolderSearch, PlusCircle, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  onReset?: () => void;
}

export function EmptyState({
  icon: Icon = FolderSearch,
  title,
  description,
  actionHref,
  actionLabel,
  onReset,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[28px] glass p-8 sm:p-12 text-center animate-in fade-in-50">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground/5 border border-foreground/10 text-foreground mb-4">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-semibold text-foreground">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
      {actionHref && actionLabel && (
        <Button asChild className="mt-6 gap-2 rounded-full font-medium h-11 px-6 shadow-xs">
          <Link href={actionHref}>
            <PlusCircle className="h-4 w-4" />
            <span>{actionLabel}</span>
          </Link>
        </Button>
      )}
      {onReset && (
        <Button
          variant="outline"
          onClick={onReset}
          className="mt-6 gap-2 rounded-full font-medium h-11 px-6 glass"
        >
          Reset Filters
        </Button>
      )}
    </div>
  );
}
