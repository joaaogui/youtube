"use client";

import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink,
  Eye,
  Clock,
  MessageSquare,
  ThumbsUp,
} from "lucide-react";
import type { VideoData } from "@/types/youtube";
import { getScoreLabel } from "@/lib/scoring";
import Image from "next/image";

const formatNumber = (num: number) => num.toLocaleString("en-US");

function ScoreBadge({ score }: { score: number }) {
  const { label, color } = getScoreLabel(score);
  
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`text-lg font-bold tabular-nums ${color}`}>
        {score.toFixed(1)}
      </span>
      <span className={`text-[10px] font-medium ${color}`}>
        {label}
      </span>
    </div>
  );
}

function ScoreBreakdown({ video }: { video: VideoData }) {
  const { scoreComponents } = video;
  
  // Handle old cached data without scoreComponents
  if (!scoreComponents) {
    return null;
  }
  
  return (
    <div className="flex gap-3 text-xs">
      <div className="flex items-center gap-1" title="Engagement (likes + comments per view)">
        <ThumbsUp className="h-3 w-3 text-blue-500" />
        <span className="tabular-nums">{scoreComponents.engagementScore?.toFixed(0) ?? '-'}</span>
      </div>
      <div className="flex items-center gap-1" title="Reach (total views)">
        <Eye className="h-3 w-3 text-green-500" />
        <span className="tabular-nums">{scoreComponents.reachScore?.toFixed(0) ?? '-'}</span>
      </div>
      <div className="flex items-center gap-1" title="Consistency (sustained engagement)">
        <Clock className="h-3 w-3 text-yellow-500" />
        <span className="tabular-nums">{scoreComponents.consistencyScore?.toFixed(0) ?? '-'}</span>
      </div>
      <div className="flex items-center gap-1" title="Community (comment ratio)">
        <MessageSquare className="h-3 w-3 text-purple-500" />
        <span className="tabular-nums">{scoreComponents.communityScore?.toFixed(0) ?? '-'}</span>
      </div>
    </div>
  );
}

const columns: ColumnDef<VideoData>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div className="flex items-center gap-3 min-w-[280px]">
        <Image
          src={row.original.thumbnail}
          alt={row.original.title}
          width={80}
          height={45}
          className="rounded object-cover flex-shrink-0"
        />
        <a
          href={row.original.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary hover:underline line-clamp-2 flex items-center gap-1 text-sm"
        >
          {row.original.title}
          <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-50" />
        </a>
      </div>
    ),
  },
  {
    accessorKey: "score",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 px-2"
      >
        Score
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex flex-col items-center gap-1">
        <ScoreBadge score={row.original.score} />
        <ScoreBreakdown video={row.original} />
      </div>
    ),
  },
  {
    accessorKey: "days",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 px-2"
      >
        Age
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const days = row.original.days;
      const label = days === 0 ? "Today" : days === 1 ? "Yesterday" : `${formatNumber(days)}d`;
      return <span className="tabular-nums text-muted-foreground">{label}</span>;
    },
  },
  {
    accessorKey: "views",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 px-2"
      >
        Views
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="tabular-nums font-medium">{formatNumber(row.original.views)}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {row.original.rates ? `${formatNumber(row.original.rates.viewsPerDay)}/day` : '-'}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "likes",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 px-2"
      >
        Likes
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="tabular-nums">{formatNumber(row.original.likes)}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {row.original.rates?.likeRate?.toFixed(1) ?? '-'}‰
        </span>
      </div>
    ),
  },
  {
    accessorKey: "comments",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 px-2"
      >
        Comments
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="tabular-nums">{formatNumber(row.original.comments)}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {row.original.rates?.commentRate?.toFixed(2) ?? '-'}‰
        </span>
      </div>
    ),
  },
  {
    id: "engagement",
    accessorFn: (row) => row.rates.engagementRate,
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 px-2"
      >
        Engagement
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const rate = row.original.rates?.engagementRate ?? 0;
      const color = rate >= 60 ? "text-emerald-500" : rate >= 40 ? "text-green-500" : rate >= 20 ? "text-yellow-500" : "text-muted-foreground";
      return (
        <span className={`tabular-nums font-medium ${color}`}>
          {rate.toFixed(1)}‰
        </span>
      );
    },
  },
];

interface VideosTableProps {
  data: VideoData[];
}

export function VideosTable({ data }: VideosTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "score", desc: true },
  ]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 25,
      },
    },
  });

  // Calculate channel averages for context
  const avgScore = data.length > 0 
    ? data.reduce((sum, v) => sum + (v.score || 0), 0) / data.length 
    : 0;
  const avgEngagement = data.length > 0
    ? data.reduce((sum, v) => sum + (v.rates?.engagementRate || 0), 0) / data.length
    : 0;

  return (
    <div className="space-y-4">
      {/* Channel Stats Summary */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5">
          <span className="text-muted-foreground">Average score:</span>
          <span className="font-semibold">{avgScore.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5">
          <span className="text-muted-foreground">Average engagement:</span>
          <span className="font-semibold">{avgEngagement.toFixed(1)}‰</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Eye className="h-3 w-3 text-green-500" />
          <span className="font-medium">Views (50%)</span>
        </div>
        <div className="flex items-center gap-1">
          <ThumbsUp className="h-3 w-3 text-blue-500" />
          <span>Engagement (25%)</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-yellow-500" />
          <span>Consistency (15%)</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3 text-purple-500" />
          <span>Community (10%)</span>
        </div>
        <div className="ml-auto text-muted-foreground">
          ‰ = per 1,000 views
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No videos found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            data.length
          )}{" "}
          of {data.length} videos
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
