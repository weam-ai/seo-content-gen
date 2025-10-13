import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Globe, ExternalLink, Download, RefreshCw, Search } from 'lucide-react';
import projectService from '@/lib/services/project.service';
import { useState, useEffect } from 'react';
import { ExportToExcel } from '@/components/ui/ExportToExcel';
import { useToast } from '@/components/ui/use-toast';
import { ServerDataTable } from '@/components/ui/ServerDataTable';
import { Input } from '@/components/ui/input';

interface ProjectSitemapTabProps {
  projectId: string;
  projectName: string;
}

export default function ProjectSitemapTab({
  projectId,
  projectName,
}: ProjectSitemapTabProps) {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sitemapData, setSitemapData] = useState<any>(null);
  const [detailedSitemap, setDetailedSitemap] = useState<any>(null);
  
  // Pagination state for detailed sitemap
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortTerm, setSortTerm] = useState('');
  
  // Filter detailed sitemap based on search term
  const filteredSitemap = Array.isArray(detailedSitemap) 
    ? detailedSitemap.filter(item => 
        searchTerm ? 
          item.url?.toLowerCase().includes(searchTerm.toLowerCase()) || 
          item.pageType?.toLowerCase().includes(searchTerm.toLowerCase()) || 
          item.metaTitle?.toLowerCase().includes(searchTerm.toLowerCase()) || 
          item.metaDescription?.toLowerCase().includes(searchTerm.toLowerCase())
        : true
      )
    : [];
    
  // Calculate pagination
  const totalRows = filteredSitemap.length;
  const totalPages = (pageSize === -1 || pageSize === 0) ? 1 : Math.ceil(totalRows / pageSize);
  
  // Apply sorting if needed
  const sortedSitemap = [...filteredSitemap];
  if (sortTerm) {
    const [field, direction] = sortTerm.split(':');
    sortedSitemap.sort((a, b) => {
      const aValue = a[field as keyof typeof a] || '';
      const bValue = b[field as keyof typeof b] || '';
      
      if (direction === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  }
  
  // Create pagination metadata for ServerDataTable
  const paginationMeta = {
    current_page: currentPage,
    total_pages: totalPages,
    total_records: totalRows,
    per_page: pageSize,
    has_next: currentPage < totalPages,
    has_prev: currentPage > 1
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };
  
  const handleSearch = (search: string) => {
    setSearchTerm(search);
    setCurrentPage(1); // Reset to first page when searching
  };
  
  const handleSort = (sort: string) => {
    setSortTerm(sort);
  };

  const fetchSitemap = async (refresh = false) => {
    setIsRefreshing(true);
    try {
      const response = await projectService.getProjectSitemap(
        projectId,
        refresh
      );
      if (response.status) {
        setSitemapData(response.data.overview);
        setDetailedSitemap(response.data.detailed);
        setCurrentPage(1); // Reset to first page
        toast({
          title: 'Success',
          description: 'Sitemap refreshed successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to refresh sitemap',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to refresh sitemap',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      void fetchSitemap();
    }
  }, [projectId]);

  return (
    <div className="space-y-6">
      {/* Sitemap Overview */}
      <Card className="hover-lift">
        <CardHeader className="flex flex-row items-center justify-between">
          <span className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-gray-800" />
            Sitemap Overview
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchSitemap(sitemapData ? true : false)}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            {sitemapData && (
              <ExportToExcel
                columns={[
                  { header: 'Sitemap URL', accessor: 'site_urls' },
                  { header: 'Total Pages', accessor: 'total_pages' },
                  ...(Array.isArray(sitemapData.contain_types)
                    ? sitemapData.contain_types.map((type: any) => ({
                        header: `${type.type} Count`,
                        accessor: `type_${type.type}`,
                      }))
                    : []),
                ]}
                data={[
                  {
                    site_urls: sitemapData.site_urls,
                    total_pages: sitemapData.total_pages,
                    ...(Array.isArray(sitemapData.contain_types)
                      ? Object.fromEntries(
                          sitemapData.contain_types.map((type: any) => [
                            `type_${type.type}`,
                            type.count,
                          ])
                        )
                      : {}),
                  },
                ]}
                filename={`sitemap-overview-${projectName || 'project'}.xlsx`}
              >
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" /> Export Overview
                </Button>
              </ExportToExcel>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sitemap URL */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Sitemap URL</Label>
              {sitemapData?.site_urls && (
                <Button
                  variant="outline"
                  size="sm"
                  className="hover-lift"
                  asChild
                >
                  <a
                    href={sitemapData.site_urls}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Sitemap
                  </a>
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground font-mono">
              {sitemapData?.site_urls || 'N/A'}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/30 rounded-lg text-center">
              <p className="text-2xl font-bold text-gray-800">
                {sitemapData?.total_pages ?? 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground">Total Pages</p>
            </div>
            {sitemapData?.contain_types?.map((type: any) => (
              <div
                key={type.type}
                className="p-4 bg-muted/30 rounded-lg text-center"
              >
                <p className="text-2xl font-bold">{type.count}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {type.type}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Sitemap Table */}
      {Array.isArray(detailedSitemap) && detailedSitemap.length > 0 && (
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Detailed Sitemap</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchSitemap(sitemapData ? true : false)}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <ExportToExcel
                columns={[
                  { header: 'URL', accessor: 'url' },
                  { header: 'Page Type', accessor: 'pageType' },
                  { header: 'Meta Title', accessor: 'metaTitle' },
                  { header: 'Meta Description', accessor: 'metaDescription' },
                ]}
                data={detailedSitemap}
                filename={`sitemap-${projectName || 'project'}.xlsx`}
              >
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" /> Export Sitemap
                </Button>
              </ExportToExcel>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search bar */}
            <div className="flex items-center mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sitemap..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* ServerDataTable */}
            <ServerDataTable
              columns={[
                {
                  header: 'URL',
                  accessor: 'url',
                  sortable: true,
                  render: (row: any) => (
                    <a
                      href={row.url}
                      className="text-gray-800 hover:underline text-sm"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {row.url}
                    </a>
                  ),
                },
                {
                  header: 'Page Type',
                  accessor: 'pageType',
                  sortable: true,
                  render: (row: any) => (
                    <Badge variant="secondary">{row.pageType}</Badge>
                  ),
                },
                {
                  header: 'Meta Title',
                  accessor: 'metaTitle',
                  sortable: true,
                  render: (row: any) => (
                    <span className="text-sm">{row.metaTitle}</span>
                  ),
                },
                {
                  header: 'Meta Description',
                  accessor: 'metaDescription',
                  sortable: true,
                  render: (row: any) => (
                    <span className="text-sm text-muted-foreground">{row.metaDescription}</span>
                  ),
                },
              ]}
              data={(pageSize === -1 || pageSize === 0) 
                ? sortedSitemap.map((item, index) => ({
                    ...item,
                    id: index.toString() // Add id property required by ServerDataTable
                  }))
                : sortedSitemap.slice(
                    (currentPage - 1) * pageSize,
                    currentPage * pageSize
                  ).map((item, index) => ({
                    ...item,
                    id: index.toString() // Add id property required by ServerDataTable
                  }))
              }
              pagination={paginationMeta}
              loading={isRefreshing}
              skeletonRowCount={5}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onSearch={handleSearch}
              onSort={handleSort}
              searchValue={searchTerm}
              sortValue={sortTerm}
              hideInternalSearch={true}
              exportable={false}
              hideInternalExport={true}
              pageSizeOptions={[10, 25, 50, 100, -1]}
              emptyText="No sitemap data found."
              className="mb-4"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
