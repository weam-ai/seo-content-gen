import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from './table';
import { Input } from './input';
import { Button } from './button';
import { Card, CardContent } from './card';
import { ExportToExcel, ExportToExcelColumn } from './ExportToExcel';
import { Pagination } from './simple-pagination';
import { Search } from 'lucide-react';

export interface DataTableColumn<T> {
  header: string;
  accessor: keyof T | string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

export interface PaginationMeta {
  current_page: number;
  total_pages: number;
  total_records: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ServerDataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  pagination?: PaginationMeta;
  actionsHeader?: string;
  renderActions?: (row: T) => React.ReactNode;
  pageSizeOptions?: number[];
  exportable?: boolean;
  exportFileName?: string;
  className?: string;
  emptyText?: string;
  loading?: boolean;
  skeletonRowCount?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSearch?: (search: string) => void;
  onSort?: (sort: string) => void;
  searchValue?: string;
  sortValue?: string;
  hideInternalSearch?: boolean;
  hideInternalExport?: boolean;
}

export function ServerDataTable<T extends { id: string | number }>(
  props: ServerDataTableProps<T>
) {
  const {
    columns,
    data,
    pagination,
    actionsHeader,
    renderActions,
    pageSizeOptions = [10, 20, 50, 100],
    exportable = false,
    exportFileName = 'export.xlsx',
    className = '',
    emptyText = 'No data found.',
    loading = false,
    skeletonRowCount = 5,
    onPageChange,
    onPageSizeChange,
    onSearch,
    onSort,
    searchValue = '',
    sortValue = '',
    hideInternalSearch = false,
    hideInternalExport = false,
  } = props;

  // Remove internal search state and debounce

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    if (onPageSizeChange) {
      onPageSizeChange(newPageSize);
    }
  };

  // Handle sort
  const handleSort = (column: DataTableColumn<T>) => {
    if (!column.sortable || !onSort) return;
    
    const accessor = typeof column.accessor === 'string' ? column.accessor : String(column.accessor);
    const currentSort = sortValue;
    const [currentField, currentOrder] = currentSort.split(':');
    
    let newSort = '';
    if (currentField === accessor) {
      // Toggle order
      newSort = currentOrder === 'asc' ? `${accessor}:desc` : `${accessor}:asc`;
    } else {
      // Default to ascending
      newSort = `${accessor}:asc`;
    }
    
    onSort(newSort);
  };

  // Export columns
  const exportColumns: ExportToExcelColumn[] = columns.map((col) => ({
    header: col.header,
    accessor:
      typeof col.accessor === 'string' ? col.accessor : String(col.accessor),
  }));

  // Render sort indicator
  const renderSortIndicator = (column: DataTableColumn<T>) => {
    if (!column.sortable) return null;
    
    const accessor = typeof column.accessor === 'string' ? column.accessor : String(column.accessor);
    const [currentField, currentOrder] = sortValue.split(':');
    
    if (currentField !== accessor) {
      return <span className="text-muted-foreground ml-1">↕</span>;
    }
    
    return (
      <span className="ml-1">
        {currentOrder === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div className={className}>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {exportable && !hideInternalExport && (
            <ExportToExcel
              columns={exportColumns}
              data={data}
              filename={exportFileName}
            >
              <Button variant="outline" size="sm" className="ml-2" disabled={loading}>
                Export to Excel
              </Button>
            </ExportToExcel>
          )}
        </div>
        {!hideInternalSearch && (
          <div className="relative">
            <Input
              placeholder="Search..."
              value={searchValue}
              onChange={(e) => onSearch && onSearch(e.target.value)}
              className="pl-10 w-64"
              disabled={loading}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Table */}
      <Card className="hover-lift bg-card/50 backdrop-blur-sm border-border/40">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead 
                    key={col.header} 
                    className={`${col.className} ${col.sortable ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                    onClick={() => handleSort(col)}
                  >
                    <div className="flex items-center">
                      {col.header}
                      {renderSortIndicator(col)}
                    </div>
                  </TableHead>
                ))}
                {renderActions && (
                  <TableHead>{actionsHeader || 'Actions'}</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading skeleton
                Array.from({ length: skeletonRowCount }).map((_, index) => (
                  <TableRow key={`skeleton-row-${index}`}>
                    {columns.map((col) => (
                      <TableCell key={col.header} className={col.className}>
                        <div className="h-4 bg-muted rounded animate-pulse"></div>
                      </TableCell>
                    ))}
                    {renderActions && (
                      <TableCell>
                        <div className="h-4 bg-muted rounded animate-pulse"></div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (renderActions ? 1 : 0)}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {emptyText}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/50">
                    {columns.map((col) => (
                      <TableCell key={col.header} className={col.className}>
                        {col.render
                          ? col.render(row)
                          : (row[col.accessor as keyof T] as React.ReactNode)}
                      </TableCell>
                    ))}
                    {renderActions && (
                      <TableCell>{renderActions(row)}</TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && (
        <Pagination
          currentPage={pagination.current_page}
          totalItems={pagination.total_records}
          itemsPerPage={pagination.per_page}
          onPageChange={onPageChange || (() => {})}
          onItemsPerPageChange={handlePageSizeChange}
          pageSizeOptions={pageSizeOptions}
          showPageSizeSelector={true}
          showJumpToPage={true}
          className="mt-8"
        />
      )}
    </div>
  );
}