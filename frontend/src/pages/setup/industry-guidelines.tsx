import { Button } from '@/components/ui/button';
import { Edit, Trash2, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ServerDataTable, DataTableColumn } from '@/components/ui/ServerDataTable';
import { useEffect, useState } from 'react';
import guidelineService, { Guideline } from '@/lib/services/guideline.service';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { useRef } from 'react';
import { ExportToExcel, ExportToExcelHandle } from '@/components/ui/ExportToExcel';
import { useIndustryGuidelinePermissions } from '@/hooks/use-permissions';

export default function IndustryGuidelinesPage() {
  const { canViewIndustryGuidelines, canCreateIndustryGuidelines, canUpdateIndustryGuidelines, canDeleteIndustryGuidelines } = useIndustryGuidelinePermissions();
  if (!canViewIndustryGuidelines) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-semibold mb-2">Not authorized</h2>
        <p className="text-muted-foreground mb-4">You do not have permission to view industry guidelines.</p>
      </div>
    );
  }
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState(''); // debounced value
  const [searchInput, setSearchInput] = useState(''); // immediate input value
  const [sort, setSort] = useState('');
  const { toast } = useToast();
  const [exportData, setExportData] = useState<any[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const exportRef = useRef<ExportToExcelHandle>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      setCurrentPage(1); // Reset to first page when searching
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Fetch guidelines with pagination
  const fetchGuidelines = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        search: search || undefined,
        sort: sort || undefined,
      };
      
      const res = await guidelineService.getGuidelines(params);
      setGuidelines(res.data || []);
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

  // Fetch guidelines on mount and when pagination params change
  useEffect(() => {
    fetchGuidelines();
  }, [currentPage, pageSize, search, sort]);

  // Delete handler with confirmation
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this guideline? This action cannot be undone.')) return;
    setDeletingId(id);
    // Optimistically remove from UI
    const prev = guidelines;
    setGuidelines(guidelines.filter((g) => g._id !== id));
    try {
      await guidelineService.deleteGuideline(id);
      toast({ title: 'Deleted', description: 'Guideline deleted successfully.' });
      // Refresh the current page
      fetchGuidelines();
    } catch (error: any) {
      setGuidelines(prev); // Rollback
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

  // Handle sort
  const handleSort = (sortTerm: string) => {
    setSort(sortTerm);
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await guidelineService.getGuidelines({ limit: -1, search: search || undefined, sort: sort || undefined });
      const data = (res.data || []).map((g) => ({
        'Name': g.name,
        'Total Projects': g.project_count,
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
  const columns: DataTableColumn<Guideline>[] = [
    {
      header: 'Name',
      accessor: 'name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="font-medium">{row.name}</span>
        </div>
      ),
    },
    {
      header: 'Total Projects',
      accessor: 'project_count',
      sortable: true,
      render: (row) => (
        <span className="text-muted-foreground font-medium">{row.project_count}</span>
      ),
    },
    {
      header: 'Created Date',
      accessor: 'created_at',
      sortable: true,
      render: (row) => (
        <span className="text-muted-foreground">{new Date(row.created_at).toLocaleDateString('en-GB')}</span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (row) => (
        <div>
          {canUpdateIndustryGuidelines && (
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/setup/industry-guidelines/${row._id}/edit`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
          )}
          {/* Duplicate not implemented for API version */}
          {canDeleteIndustryGuidelines && (
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
          title="Industry Guidelines Management"
          description="Manage industry-specific content guidelines and best practices"
        >
          {canCreateIndustryGuidelines && (
            <Link to="/setup/industry-guidelines/new">
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                Add Guideline
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
                placeholder="Search guidelines..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
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
                { header: 'Total Projects', accessor: 'Total Projects' },
                { header: 'Created Date', accessor: 'Created Date' },
              ]}
              data={exportData}
              filename={`industry-guidelines-${new Date().toISOString().split('T')[0]}.xlsx`}
            >
              <span style={{ display: 'none' }} />
            </ExportToExcel>
          </div>
        </div>
        {/* ServerDataTable */}
        <ServerDataTable
          columns={columns}
          data={guidelines}
          pagination={pagination}
          exportable
          exportFileName="industry-guidelines.xlsx"
          // className="mb-8"
          loading={loading}
          skeletonRowCount={5}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onSearch={setSearchInput}
          onSort={handleSort}
          searchValue={searchInput}
          sortValue={sort}
          hideInternalSearch={true}
          hideInternalExport={true}
        />
      </div>
    </div>
  );
}
