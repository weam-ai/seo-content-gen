import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from '@/components/ui/command';
import {
  Check,
  LayoutGrid,
  List,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import React from 'react';

interface Project {
  _id: string;
  name: string;
}
// Member and Agency interfaces removed for single-user application

type ViewMode = 'grid' | 'list' | 'calendar';

interface SortOptionGroup {
  group: string;
  options: { value: string; label: string }[];
}

interface TopicToolbarProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  projectFilter: string;
  setProjectFilter: (v: string) => void;
  projects: Project[];
  projectsLoading: boolean;
  projectsPopoverOpen: boolean;
  setProjectsPopoverOpen: (v: boolean) => void;
  // Member and agency filtering removed for single-user application
  clearFilters: () => void;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  statusOptions?: { value: string; label: string }[];
  sortOrder: string;
  setSortOrder: (v: string) => void;
  sortOptions?: SortOptionGroup[]; // <-- FIXED TYPE
  hideAgencyFilter?: boolean; // <-- NEW PROP
}

export const FilterUtilityBar: React.FC<TopicToolbarProps> = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  projectFilter,
  setProjectFilter,
  projects,
  projectsLoading,
  projectsPopoverOpen,
  setProjectsPopoverOpen,
  // Member and agency filtering parameters removed for single-user application
  clearFilters,
  viewMode,
  setViewMode,
  statusOptions,
  sortOrder,
  setSortOrder,
  sortOptions,
  // hideAgencyFilter removed for single-user application
}) => {
  const defaultStatusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending Approval' },
    { value: 'rejected', label: 'Rejected' },
  ];
  const options = statusOptions || defaultStatusOptions;
  const defaultSortOptions: SortOptionGroup[] = [
    {
      group: 'Date',
      options: [
        { value: 'created_at:desc', label: 'Newest First' },
        { value: 'created_at:asc', label: 'Oldest First' },
      ],
    },
    {
      group: 'Name',
      options: [
        { value: 'title:asc', label: 'Name (A-Z)' },
        { value: 'title:desc', label: 'Name (Z-A)' },
      ],
    },
    // Agency sorting removed for single-user application
  ];
  const effectiveSortOptions = sortOptions || defaultSortOptions;
  return (
    <div className="flex flex-col sm:flex-row gap-2 py-6">
      <div className="relative flex-1">
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <Input
          placeholder="Search topics or keywords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="flex items-center gap-2 md:flex-row flex-col">
        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={options[0].label} />
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Sort Dropdown */}
        <Select
          value={sortOrder}
          onValueChange={(value) => setSortOrder(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {effectiveSortOptions.map((group, idx) => (
              <SelectGroup key={group.group || idx}>
                <SelectLabel>{group.group}</SelectLabel>
                {group.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        {/* Project Filter */}
        <Popover
          open={projectsPopoverOpen}
          onOpenChange={setProjectsPopoverOpen}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-[160px] justify-between overflow-hidden"
              aria-expanded={projectsPopoverOpen}
            >
              <span
                className="truncate"
                title={
                  projectFilter === 'all'
                    ? 'All Projects'
                    : projects.find((p) => p._id === projectFilter)?.name ||
                    'All Projects'
                }
              >
                {projectFilter === 'all'
                  ? 'All Projects'
                  : projects.find((p) => p._id === projectFilter)?.name ||
                  'All Projects'}
              </span>
              <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[240px]">
            <Command>
              <CommandInput placeholder="Search projects..." />
              <CommandList>
                <CommandItem
                  key="all"
                  value="all projects"
                  onSelect={() => {
                    setProjectFilter('all');
                    setProjectsPopoverOpen(false);
                    toast({
                      title: 'Filter Updated',
                      description: 'Showing topics from all projects',
                    });
                  }}
                >
                  <Check
                    className={
                      projectFilter === 'all'
                        ? 'mr-2 h-4 w-4 opacity-100'
                        : 'mr-2 h-4 w-4 opacity-0'
                    }
                  />
                  All Projects
                </CommandItem>
                {projectsLoading ? (
                  <CommandItem disabled>Loading projects...</CommandItem>
                ) : projects.length === 0 ? (
                  <CommandEmpty>No projects</CommandEmpty>
                ) : (
                  projects.map((project) => (
                    <CommandItem
                      key={project._id}
                      value={`${project._id}|||${project.name.toLowerCase()}`}
                      onSelect={(v) => {
                        const id = v.split('|||')[0];
                        setProjectFilter(id);
                        setProjectsPopoverOpen(false);
                        toast({
                          title: 'Filter Updated',
                          description: `Showing topics from project: ${project.name}`,
                        });
                      }}
                    >
                      <Check
                        className={
                          projectFilter === project._id
                            ? 'mr-2 h-4 w-4 opacity-100'
                            : 'mr-2 h-4 w-4 opacity-0'
                        }
                      />
                      {project.name}
                    </CommandItem>
                  ))
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {/* Member Filter removed for single-user application */}
        {/* Agency Filter removed for single-user application */}
        <Button variant="outline" size="sm" onClick={clearFilters}>
          Clear Filters
        </Button>
        <div className="flex border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="rounded-r-none"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-none"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('calendar')}
            className="rounded-l-none"
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterUtilityBar;
