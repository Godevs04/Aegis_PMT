'use client';

import React from 'react';

/**
 * Reusable skeleton loading components for consistent loading states.
 */

export function CardSkeleton() {
  return (
    <div className="p-5 rounded-xl border border-border bg-card/50 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-9 w-9 rounded-lg bg-secondary" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3 w-32 bg-secondary rounded" />
          <div className="h-2 w-16 bg-secondary rounded" />
        </div>
      </div>
      <div className="h-2 w-full bg-secondary rounded mb-2" />
      <div className="h-2 w-3/4 bg-secondary rounded" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 animate-pulse">
      <div className="h-3 w-3 bg-secondary rounded" />
      <div className="h-3 w-12 bg-secondary rounded" />
      <div className="h-2.5 w-2.5 bg-secondary rounded-full" />
      <div className="h-3 flex-1 bg-secondary rounded" />
      <div className="h-3 w-16 bg-secondary rounded" />
      <div className="h-5 w-5 bg-secondary rounded-full" />
      <div className="h-3 w-14 bg-secondary rounded" />
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-0">
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} />
      ))}
    </div>
  );
}

export function GridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: cards }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl border border-border bg-card/50 animate-pulse">
          <div className="h-2 w-16 bg-secondary rounded mb-3" />
          <div className="h-6 w-10 bg-secondary rounded" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-5 w-48 bg-secondary rounded" />
        <div className="h-3 w-72 bg-secondary rounded" />
      </div>
      <StatsSkeleton />
      <GridSkeleton />
    </div>
  );
}
