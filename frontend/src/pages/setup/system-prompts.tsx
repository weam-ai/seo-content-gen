import { useEffect, useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ServerDataTable, DataTableColumn } from '@/components/ui/ServerDataTable';
import systemPromptService, { SystemPrompt } from '@/lib/services/system-prompt.service';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { useRef } from 'react';
import { ExportToExcel, ExportToExcelHandle } from '@/components/ui/ExportToExcel';
import { useSystemPromptPermissions } from '@/hooks/use-permissions';

export default function SystemPromptsPage() {
  const { canViewSystemPrompts, canCreateSystemPrompts, canUpdateSystemPrompts, canDeleteSystemPrompts } = useSystemPromptPermissions();
  if (!canViewSystemPrompts) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-semibold mb-2">Not authorized</h2>
        <p className="text-muted-foreground mb-4">You do not have permission to view system prompts.</p>
      </div>
    );
  }
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const { toast } = useToast();
  const [exportData, setExportData] = useState<any[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const exportRef = useRef<ExportToExcelHandle>(null);

  // Fetch prompts with pagination
  const fetchPrompts = async () => {
    setLoading(true);
    try {
      // Always include type in the params if not 'all', e.g. type: 'topic_title'
      const params: Record<string, any> = {
        page: currentPage,
        limit: pageSize,
        search: search || undefined,
        sort: sort || undefined,
      };
      if (typeFilter && typeFilter !== 'all') {
        params.type = typeFilter; // e.g. 'topic_title', 'article', etc.
      }
      
      const res = await systemPromptService.getSystemPrompts(params);
      setPrompts(res.data || []);
      setPagination({
        current_page: Number(res.pagination?.current_page) || 1,
        per_page: Number(res.pagination?.per_page) || pageSize, // fallback to current pageSize state
        total_records: Number(res.pagination?.total_records) || 0,
        total_pages: Number(res.pagination?.total_pages) || 1,
      });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch prompts on mount and when pagination params change
  useEffect(() => {
    fetchPrompts();
  }, [currentPage, pageSize, search, sort, typeFilter]);

  // Delete handler with confirmation
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this system prompt? This action cannot be undone.')) return;
    setDeletingId(id);
    // Optimistically remove from UI
    const prev = prompts;
    setPrompts(prompts.filter((g) => g._id !== id));
    try {
      await systemPromptService.deleteSystemPrompt(id);
      toast({ title: 'Deleted', description: 'System prompt deleted successfully.' });
      // Refresh the current page
      fetchPrompts();
    } catch (error: any) {
      setPrompts(prev); // Rollback
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Handle search
  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle sort
  const handleSort = (sortTerm: string) => {
    setSort(sortTerm);
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Handle type filter change
  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    setCurrentPage(1);
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await systemPromptService.getSystemPrompts({ limit: -1, search: search || undefined, sort: sort || undefined });
      const data = (res.data || []).map((g) => ({
        'Name': g.name,
        'Type': g.type.replace(/_/g, ' '),
        'Default': g.is_default ? 'Yes' : 'No',
        'Date Added': new Date(g.createdAt).toLocaleDateString('en-GB'),
        'Date Updated': new Date(g.updatedAt).toLocaleDateString('en-GB'),
      }));
      setExportData(data);
      setTimeout(() => {
        exportRef.current?.exportNow();
        setExportData([]);
      }, 100);
    } catch (err) {}
    setExportLoading(false);
  };

  // Columns for DataTable
  const columns: DataTableColumn<SystemPrompt>[] = [
    {
      header: 'Name',
      accessor: 'name',
      sortable: true,
      render: (row) => (
        <span className="font-medium">{row.name}</span>
      ),
    },
    {
      header: 'Type',
      accessor: 'type',
      sortable: true,
      render: (row) => (
        <span className="capitalize">{row.type.replace(/_/g, ' ')}</span>
      ),
    },
    {
      header: 'Default',
      accessor: 'is_default',
      sortable: true,
      render: (row) => (
        <span className={row.is_default ? 'text-green-600 font-semibold' : 'text-muted-foreground'}>
          {row.is_default ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      header: 'Date Added',
      accessor: 'createdAt',
      sortable: true,
      render: (row) => (
        <span className="text-muted-foreground">{new Date(row.createdAt).toLocaleDateString('en-GB')}</span>
      ),
    },
    {
      header: 'Date Updated',
      accessor: 'updatedAt',
      sortable: true,
      render: (row) => (
        <span className="text-muted-foreground">{new Date(row.updatedAt).toLocaleDateString('en-GB')}</span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (row) => (
        <div>
          {canUpdateSystemPrompts && (
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/setup/system-prompts/${row._id}/edit`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
          )}
          {/* Duplicate not implemented for API version */}
          {canDeleteSystemPrompts && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(row._id)}
              disabled={deletingId === row._id}
            >
              {deletingId === row._id ? (
                <span className="animate-spin"><Trash2 className="h-4 w-4 text-destructive" /></span>
              ) : (
                <Trash2 className="h-4 w-4 text-destructive" />
              )}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="System Prompts Management"
          description="Manage AI system prompts and templates"
        >
          {canCreateSystemPrompts && (
            <Link to="/setup/system-prompts/new">
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                Add Prompt
              </Button>
            </Link>
          )}
        </PageHeader>
        {/* Filters and Search - System Prompts style */}
        <div className="flex flex-col sm:flex-row gap-4 py-6 items-center">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search system prompts..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Prompt Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prompt Type </SelectItem>
                <SelectItem value="article">Article</SelectItem>
                <SelectItem value="topic_title">Topic Title</SelectItem>
                <SelectItem value="topic_outline">Topic Outline</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="default"
              size="sm"
              onClick={handleExport}
              disabled={exportLoading}
            >
              {exportLoading ? 'Exporting...' : 'Export to Excel'}
            </Button>
            <ExportToExcel
              ref={exportRef}
              columns={[
                { header: 'Name', accessor: 'Name' },
                { header: 'Type', accessor: 'Type' },
                { header: 'Default', accessor: 'Default' },
                { header: 'Date Added', accessor: 'Date Added' },
                { header: 'Date Updated', accessor: 'Date Updated' },
              ]}
              data={exportData}
              filename={`system-prompts-${new Date().toISOString().split('T')[0]}.xlsx`}
            >
              <span style={{ display: 'none' }} />
            </ExportToExcel>
          </div>
        </div>
        {/* ServerDataTable */}
        <ServerDataTable
          columns={columns}
          data={prompts}
          pagination={pagination}
          exportable
          exportFileName="system-prompts.xlsx"
          className="mb-8"
          loading={loading}
          skeletonRowCount={5}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onSearch={handleSearch}
          onSort={handleSort}
          searchValue={search}
          sortValue={sort}
          hideInternalSearch={true}
          hideInternalExport={true}
        />
      </div>
    </div>
  );
}
