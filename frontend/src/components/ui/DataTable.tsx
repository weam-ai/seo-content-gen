import React, { useMemo, useState } from 'react';
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

export interface DataTableColumn<T> {
  header: string;
  accessor: keyof T | string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  searchKeys?: (keyof T | string)[];
  actionsHeader?: string;
  renderActions?: (row: T) => React.ReactNode;
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  exportable?: boolean;
  exportFileName?: string;
  className?: string;
  emptyText?: string;
  // External pagination props for server-side pagination
  page?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  totalRecords?: number;
  // External search props
  searchValue?: string;
  onSearch?: (value: string) => void;
  // Loading state
  loading?: boolean;
}

function normalizeString(val: any) {
  if (typeof val === 'string') return val.toLowerCase();
  if (typeof val === 'number') return String(val);
  return '';
}

export function DataTable<T extends { id: string | number }>(
  props: DataTableProps<T>
) {
  const {
    columns,
    data,
    searchKeys,
    actionsHeader,
    renderActions,
    pageSizeOptions = [10, 20, 50, 100, 500],
    defaultPageSize = 20,
    exportable = false,
    exportFileName = 'export.xlsx',
    className = '',
    emptyText = 'No data found.',
    page,
    onPageChange,
    pageSize,
    onPageSizeChange,
    totalRecords,
    searchValue,
    onSearch,
    loading,
  } = props;

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(page || 1);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize || defaultPageSize);

  // Use external search if provided, otherwise use internal search
  const effectiveSearch = searchValue !== undefined ? searchValue : search;
  const handleSearchChange = (value: string) => {
    if (onSearch) {
      onSearch(value);
    } else {
      setSearch(value);
    }
  };

  // Filtered data
  const filteredData = useMemo(() => {
    if (!effectiveSearch || !searchKeys || searchKeys.length === 0) return data;
    return data.filter((row) =>
      searchKeys.some((key) =>
        normalizeString(row[key as keyof T]).includes(effectiveSearch.toLowerCase())
      )
    );
  }, [data, effectiveSearch, searchKeys]);

  // Pagination
  const totalRecordsCount = totalRecords || filteredData.length;
  const paginatedData = useMemo(() => {
    // If external pagination is provided, use data as-is (server-side pagination)
    if (page !== undefined && pageSize !== undefined) {
      return filteredData;
    }
    // Otherwise, do client-side pagination
    return filteredData.slice((currentPage - 1) * currentPageSize, currentPage * currentPageSize);
  }, [filteredData, currentPage, currentPageSize, page, pageSize]);

  // Export columns
  const exportColumns: ExportToExcelColumn[] = columns.map((col) => ({
    header: col.header,
    accessor:
      typeof col.accessor === 'string' ? col.accessor : String(col.accessor),
  }));

  // Reset page if data changes
  React.useEffect(() => {
    setCurrentPage(page || 1);
  }, [page, data]);

  return (
    <div className={className}>
      {/* Controls - only for client-side pagination */}
      {page === undefined && pageSize === undefined && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Show:</span>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={currentPageSize}
              onChange={(e) => setCurrentPageSize(Number(e.target.value))}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            {exportable && (
              <ExportToExcel
                columns={exportColumns}
                data={filteredData}
                filename={exportFileName}
              >
                <Button variant="outline" size="sm" className="ml-2">
                  Export to Excel
                </Button>
              </ExportToExcel>
            )}
          </div>
          <div className="relative">
            <Input
              placeholder="Search..."
              value={effectiveSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 w-64"
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path
                  stroke="currentColor"
                  strokeWidth="2"
                  d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.6 10.6Z"
                />
              </svg>
            </span>
          </div>
        </div>
      )}
      {/* Table */}
      <Card className="hover-lift bg-card/50 backdrop-blur-sm border-border/40">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.header} className={col.className}>
                    {col.header}
                  </TableHead>
                ))}
                {renderActions && (
                  <TableHead>{actionsHeader || 'Actions'}</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (renderActions ? 1 : 0)}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (renderActions ? 1 : 0)}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {emptyText}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row) => (
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
      {/* Pagination - only show if external pagination is not provided */}
      {page === undefined && pageSize === undefined && (
        <Pagination
          currentPage={currentPage}
          totalItems={totalRecordsCount}
          itemsPerPage={currentPageSize}
          onPageChange={onPageChange || setCurrentPage}
          onItemsPerPageChange={onPageSizeChange || setCurrentPageSize}
          pageSizeOptions={pageSizeOptions}
          showPageSizeSelector={true}
          showJumpToPage={true}
          className="mt-8"
        />
      )}
    </div>
  );
}

export default DataTable;

// Usage Example (TypeScript):
// <DataTable
//   columns={[
//     { header: 'Name', accessor: 'name' },
//     { header: 'Description', accessor: 'description', render: (row) => <b>{row.description}</b> },
//   ]}
//   data={dataArray}
//   searchKeys={['name', 'description']}
//   renderActions={(row) => <Button>Edit</Button>}
//   exportable
// />
