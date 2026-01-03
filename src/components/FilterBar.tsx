import { Filter, Download, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface FilterBarProps {
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  regionFilter: string;
  setRegionFilter: (value: string) => void;
  regions?: string[];
  versionFilter?: string;
  setVersionFilter?: (v: string) => void;
  versions?: string[];
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  viewMode: "table" | "grid";
  setViewMode: (mode: "table" | "grid") => void;
  onExport?: () => void;
}

export function FilterBar({
  statusFilter,
  setStatusFilter,
  regionFilter,
  setRegionFilter,
  regions = [],
  versionFilter,
  setVersionFilter,
  versions,
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  onExport,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 mb-4 sm:mb-6">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground flex-shrink-0" />
        <Input
          placeholder="Search by Node ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-9 text-sm bg-secondary/50 border-border/50"
        />
      </div>
      
      <div className="flex gap-2 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 text-sm flex-1 sm:flex-none sm:w-[130px] bg-secondary/50 border-border/50">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="syncing">Syncing</SelectItem>
          </SelectContent>
        </Select>

        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="h-9 text-sm flex-1 sm:flex-none sm:w-[160px] bg-secondary/50 border-border/50">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border max-h-60 overflow-auto">
            <SelectItem value="all">All Regions</SelectItem>
            <SelectItem value="na">North America</SelectItem>
            <SelectItem value="eu">Europe</SelectItem>
            <SelectItem value="asia">Asia Pacific</SelectItem>
            {regions.length > 0 && (
              <div className="px-2 pt-1 text-xs text-muted-foreground">Specific Regions</div>
            )}
            {regions.map(r => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Version filter (optional) */}
        {versions && setVersionFilter && (
          <Select value={versionFilter} onValueChange={setVersionFilter}>
            <SelectTrigger className="h-9 text-sm flex-1 sm:flex-none sm:w-[140px] bg-secondary/50 border-border/50">
              <SelectValue placeholder="Version" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Versions</SelectItem>
              {versions.map(v => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="flex border border-border/50 rounded-lg overflow-hidden">
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            className="rounded-none h-9"
            onClick={() => setViewMode("table")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            className="rounded-none h-9"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>

        <Button variant="outline" size="sm" className="border-border/50 h-9 text-sm" onClick={() => onExport && onExport()}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
    </div>
  );
}
