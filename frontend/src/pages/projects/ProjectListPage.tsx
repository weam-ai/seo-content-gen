import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { ProjectCard } from '@/components/ui/project-card';
import { Plus, Search, LayoutGrid, List, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pagination } from '@/components/ui/simple-pagination';
import { Link, useLocation } from 'react-router-dom';
import projectService, {
  GetProjectsParams,
} from '@/lib/services/project.service.ts';
// Removed agencyService import for single-user application
import { useToast } from '@/hooks/use-toast.ts';
import { useDebounce } from '@/hooks/use-debounce';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
// Removed Popover, Command, and related imports for single-user application
// import userService from '@/lib/services/user.service'; // Removed for single-user application
import { TooltipProvider } from '@/components/ui/tooltip';
// import { useAuthStore } from '@/stores/auth-store'; // Removed for single-user application
// Removed ROLE_ACCESS_LEVELS import for single-user application

// Helper functions for localStorage
const getStoredProjectFilters = () => {
  try {
    const stored = localStorage.getItem('projects-filters');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveProjectFiltersToStorage = (filters: any) => {
  try {
    localStorage.setItem('projects-filters', JSON.stringify(filters));
  } catch {
    // Ignore localStorage errors
  }
};

// Project interfaces
// Removed AssignMember interface for single-user application

interface KeywordMetric {
  keyword: string;
  keyword_volume: number;
  keyword_difficulty: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface Project {
  _id: string;
  name: string;
  website_url: string;
  created_at: string;
  description: string;
  keywords: KeywordMetric[] | null;
  // Removed assign_member field for single-user application
  // Removed agency_name field for single-user application
}

// Removed Agency interface for single-user application

export default function Projects() {
  // const { user } = useAuthStore(); // Removed for single-user application
  const location = useLocation();
  const [projects, setProjects] = useState<Project[]>([]);
  // Removed agencies state for single-user application
  const [isLoading, setIsLoading] = useState(true);

  // Initialize filters from localStorage or defaults
  const storedFilters = getStoredProjectFilters();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(storedFilters.viewMode || 'grid');

  // Filters and Pagination State
  const [searchQuery, setSearchQuery] = useState(storedFilters.searchQuery || '');
  const [sortOrder, setSortOrder] = useState(storedFilters.sortOrder || 'created_at:desc');
  // Removed selectedAgencyId for single-user application
  const [itemsPerPage, setItemsPerPage] = useState(storedFilters.itemsPerPage || 12);
  const [pagination, setPagination] = useState({
    currentPage: storedFilters.currentPage || 1,
    totalPages: 1,
    totalRecords: 0,
  });

  // Removed team member state for single-user application

  const { toast } = useToast();
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Single user application - no role restrictions
  // const isAgencyUser = false; // Removed unused variable

  // Add window focus event listener to refresh data when user returns to the page
  useEffect(() => {
    const handleFocus = () => {
      // Force a refresh by updating pagination
      setPagination(prev => ({ ...prev })); // This will trigger the fetchProjects useEffect
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    const filters = {
      searchQuery,
      sortOrder,
      // selectedAgencyId removed for single-user application
      itemsPerPage,
      currentPage: pagination.currentPage,
      // selectedMembers removed for single-user application
      viewMode,
    };
    saveProjectFiltersToStorage(filters);
  }, [
    searchQuery,
    sortOrder,
    // selectedAgencyId removed for single-user application
    itemsPerPage,
    pagination.currentPage,
    // selectedMembers removed for single-user application
    viewMode,
  ]);

  // State for ConfirmDialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Removed agency fetching for single-user application

  // Removed team member fetching for single-user application

  // Data Fetching Effect
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const params: GetProjectsParams = {
          page: pagination.currentPage,
          limit: itemsPerPage,
          search: debouncedSearch,
          sort: sortOrder,
          // Removed agency and member filtering for single-user application
        };
        const response = await projectService.getProjects(params);
        if (response.status) {
          setProjects(response.data);
          setPagination({
            currentPage: response.pagination.current_page,
            totalPages: response.pagination.total_pages,
            totalRecords: response.pagination.total_records,
          });
        } else {
          toast({
            title: 'Error',
            description: 'Failed to fetch projects',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description:
            error instanceof Error ? error.message : 'An error occurred',
          variant: 'destructive',     
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [
    debouncedSearch,
    sortOrder,
    pagination.currentPage,
    itemsPerPage,
    toast,
    location.pathname, // Add location dependency to refresh on navigation
  ]);

  // Replace handleDeleteProject to open dialog
  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project);
    setShowDeleteDialog(true);
  };

  // Confirm deletion handler
  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    setDeleteLoading(true);
    try {
      await projectService.deleteProject(projectToDelete._id);
      toast({
        title: 'Deleted',
        description: 'Project has been deleted successfully.',
        variant: 'default',
      });
      // Optionally, refetch projects or remove from state
      setProjects((prev) => prev.filter((p) => p._id !== projectToDelete._id));
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete projects',
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(false);
      setShowDeleteDialog(false);
      setProjectToDelete(null);
    }
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: page }));
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSortOrder('created_at:desc');
    // Removed agency and member filter clearing for single-user application
    setViewMode('grid');
    setItemsPerPage(12);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    
    // Clear from localStorage
    try {
      localStorage.removeItem('projects-filters');
    } catch {
      // Ignore localStorage errors
    }
  };

  return (
    <TooltipProvider>
      <div className="">
        <main className="container mx-auto md:px-4 px-2 md:py-8 py-4">
          <PageHeader
            title="Projects"
            description="Manage your content writing projects and collaborate with your team"
          >
            <Link to="/projects/new">
              <Button className="" size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </Link>
          </PageHeader>

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-2 py-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPagination((prev) => ({ ...prev, currentPage: 1 }));
                }}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 md:flex-row flex-col">
              <Select
                value={sortOrder}
                onValueChange={(value) => {
                  setSortOrder(value);
                  setPagination((prev) => ({ ...prev, currentPage: 1 }));
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Date</SelectLabel>
                    <SelectItem value="created_at:desc">
                      Newest First
                    </SelectItem>
                    <SelectItem value="created_at:asc">Oldest First</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Name</SelectLabel>
                    <SelectItem value="name:asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name:desc">Name (Z-A)</SelectItem>
                  </SelectGroup>
                  {/* Removed agency sorting for single-user application */}
                </SelectContent>
              </Select>
              {/* Removed agency filter for single-user application */}
              {/* Removed members filter for single-user application */}
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
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
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Projects Grid/List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-gray-800" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <div className="md:w-24 md:h-24 w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
                <Search className="md:h-12 md:w-12 h-9 w-9 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-1">No projects found</h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <div>
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
                }
              >
                {projects.map((project) => (
                  <ProjectCard
                    key={project._id}
                    project={project}
                    onDelete={handleDeleteProject}
                  />
                ))}
              </div>
              <Pagination
                currentPage={pagination.currentPage}
                totalItems={pagination.totalRecords}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={(newSize) => {
                  setItemsPerPage(newSize);
                  setPagination((prev) => ({ ...prev, currentPage: 1 }));
                }}
                pageSizeOptions={[12, 24, 36, 60, 120, 240, -1]}
                showPageSizeSelector={true}
                showJumpToPage={true}
                className="mt-8"
              />
            </div>
          )}
        </main>
        {/* ConfirmDialog for project deletion */}
        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={(open) => {
            setShowDeleteDialog(open);
            if (!open) setProjectToDelete(null);
          }}
          title="Delete Project?"
          description={`Are you sure you want to delete the project "${projectToDelete?.name}"? This action will permanently delete the project and all associated articles, content, and data. This cannot be undone.`}
          onConfirm={handleConfirmDelete}
          confirmText="Delete"
          cancelText="Cancel"
          loading={deleteLoading}
          confirmButtonClassName="bg-red-600 hover:bg-red-700 text-white"
        />
      </div>
    </TooltipProvider>
  );
}
