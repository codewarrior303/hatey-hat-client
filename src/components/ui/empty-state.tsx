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
}

export function EmptyState({
  icon: Icon = FolderSearch,
  title,
  description,
  actionHref,
  actionLabel,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center animate-in fade-in-50">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="font-heading text-lg font-bold text-foreground">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
      {actionHref && actionLabel && (
        <Button asChild className="mt-6 gap-2">
          <Link href={actionHref}>
            <PlusCircle className="h-4 w-4" />
            <span>{actionLabel}</span>
          </Link>
        </Button>
      )}
    </div>
  );
}
