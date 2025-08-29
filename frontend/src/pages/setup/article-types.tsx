import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { ServerDataTable, DataTableColumn } from '@/components/ui/ServerDataTable';
import promptTypeService, { PromptType } from '@/lib/services/prompt-type.service';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { useRef } from 'react';
import { ExportToExcel, ExportToExcelHandle } from '@/components/ui/ExportToExcel';
import { useSystemPromptPermissions } from '@/hooks/use-permissions';

export default function ArticleTypesPage() {
  const { canViewSystemPrompts, canCreateSystemPrompts, canUpdateSystemPrompts, canDeleteSystemPrompts } = useSystemPromptPermissions();
  if (!canViewSystemPrompts) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-semibold mb-2">Not authorized</h2>
        <p className="text-muted-foreground mb-4">You do not have permission to view article types.</p>
      </div>
    );
  }
  const [articleTypes, setArticleTypes] = useState<PromptType[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  const { toast } = useToast();
  const [exportData, setExportData] = useState<any[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const exportRef = useRef<ExportToExcelHandle>(null);

  // Fetch article types with pagination
  const fetchArticleTypes = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        search: search || undefined,
        sort: sort || undefined,
      };
      
      const res = await promptTypeService.getPromptTypes(params);
      setArticleTypes(res.data || []);
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

  // Fetch article types on mount and when pagination params change
  useEffect(() => {
    fetchArticleTypes();
  }, [currentPage, pageSize, search, sort]);

  // Delete handler with confirmation
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this article type? This action cannot be undone.')) return;
    setDeletingId(id);
    // Optimistically remove from UI
    const prev = articleTypes;
    setArticleTypes(articleTypes.filter((g) => g.id !== id));
    try {
      await promptTypeService.deletePromptType(id);
      toast({ title: 'Deleted', description: 'Article type deleted successfully.' });
      // Refresh the current page
      fetchArticleTypes();
    } catch (error: any) {
      setArticleTypes(prev); // Rollback
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

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await promptTypeService.getPromptTypes({ limit: -1, search: search || undefined, sort: sort || undefined });
      const data = (res.data || []).map((g) => ({
        'Name': g.name,
        'Title Prompt': g.titlePrompt?.name || 'N/A',
        'Outline Prompt': g.outlinePrompt?.name || 'N/A',
        'Article Prompt': g.articlePrompt?.name || 'N/A',
        'Created Date': new Date(g.created_at).toLocaleDateString('en-GB'),
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
  const columns: DataTableColumn<PromptType>[] = [
    {
      header: 'Name',
      accessor: 'name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-purple-500"></div>
          <span className="font-medium">{row.name}</span>
        </div>
      ),
    },
    {
      header: 'Title Prompt',
      accessor: 'titlePrompt',
      sortable: true,
      render: (row) => (
        <span className="text-sm text-muted-foreground">{row.titlePrompt?.name || 'N/A'}</span>
      ),
    },
    {
      header: 'Outline Prompt',
      accessor: 'outlinePrompt',
      sortable: true,
      render: (row) => (
        <span className="text-sm text-muted-foreground">{row.outlinePrompt?.name || 'N/A'}</span>
      ),
    },
    {
      header: 'Article Prompt',
      accessor: 'articlePrompt',
      sortable: true,
      render: (row) => (
        <span className="text-sm text-muted-foreground">{row.articlePrompt?.name || 'N/A'}</span>
      ),
    },
    {
      header: 'Created Date',
      accessor: 'created_at',
      sortable: true,
      render: (row) => (
        <span className="text-sm text-muted-foreground">{new Date(row.created_at).toLocaleDateString('en-GB')}</span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (row) => (
        <div>
          {canUpdateSystemPrompts && (
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/setup/article-types/${row.id}/edit`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
          )}
          {/* Duplicate not implemented for API version */}
          {canDeleteSystemPrompts && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(row.id)}
              disabled={deletingId === row.id}
            >
              {deletingId === row.id ? (
                <span className="animate-spin"><Trash2 className="h-4 w-4 text-red-600" /></span>
              ) : (
                <Trash2 className="h-4 w-4 text-red-600" />
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
          title="Article Types Management"
          description="Manage article types and their configurations for your organization"
        >
          {canCreateSystemPrompts && (
            <Link to="/setup/article-types/new">
              <Button className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="h-4 w-4" />
                Add Article Type
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
                  placeholder="Search article types..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
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
                  { header: 'Title Prompt', accessor: 'Title Prompt' },
                  { header: 'Outline Prompt', accessor: 'Outline Prompt' },
                  { header: 'Article Prompt', accessor: 'Article Prompt' },
                  { header: 'Created Date', accessor: 'Created Date' },
                ]}
                data={exportData}
                filename={`article-types-${new Date().toISOString().split('T')[0]}.xlsx`}
              >
                <span style={{ display: 'none' }} />
              </ExportToExcel>
            </div>
          </div>
          {/* ServerDataTable */}
          <ServerDataTable
            columns={columns}
            data={articleTypes}
            pagination={pagination}
            exportable
            exportFileName="article-types.xlsx"
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
