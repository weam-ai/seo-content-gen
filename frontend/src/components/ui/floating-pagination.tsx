import React, { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

interface FloatingPaginationProps {
  totalPages: number;
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  className?: string;
  loading?: boolean;
}

const FloatingPagination: React.FC<FloatingPaginationProps> = ({
  totalPages,
  currentPage,
  pageSize,
  totalRecords,
  onPageChange,
  onPageSizeChange,
  className = '',
  loading = false,
}) => {
  const [pageInput, setPageInput] = useState('');

  // Page numbers with ellipsis logic
  const pageNumbers = React.useMemo(() => {
    if (totalPages <= 5)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const nums: (number | 'ellipsis')[] = [];
    if (currentPage > 2) nums.push(1);
    if (currentPage > 3) nums.push('ellipsis');
    for (
      let i = Math.max(1, currentPage - 1);
      i <= Math.min(totalPages, currentPage + 1);
      i++
    ) {
      nums.push(i);
    }
    if (currentPage < totalPages - 2) nums.push('ellipsis');
    if (currentPage < totalPages - 1) nums.push(totalPages);
    return nums;
  }, [currentPage, totalPages]);

  return (
    <>
      <div className={`w-full flex justify-center mt-8 ${className}`}>
        <div
          className="flex items-center gap-3 px-4 py-2 rounded-full bg-background/80 border border-border shadow-sm backdrop-blur-md"
          style={{ minHeight: 48 }}
        >
          {/* Show (page size) */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Show</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                onPageSizeChange(Number(v));
                onPageChange(1);
              }}
            >
              <SelectTrigger className="w-[64px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100, 500].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Pagination Buttons */}
          <div className="flex items-center gap-1 mx-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === 1 || loading}
              onClick={() => onPageChange(1)}
            >
              <span className="sr-only">First</span>
              {'|<'}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === 1 || loading}
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            >
              <span className="sr-only">Prev</span>
              {'<'}
            </Button>
            {pageNumbers.map((num, idx) =>
              num === 'ellipsis' ? (
                <span key={idx} className="px-1 text-muted-foreground">
                  ...
                </span>
              ) : (
                <Button
                  key={num}
                  variant={num === currentPage ? 'default' : 'ghost'}
                  size="icon"
                  className={`h-8 w-8 ${
                    num === currentPage ? 'bg-primary/10' : ''
                  }`}
                  onClick={() => onPageChange(num as number)}
                  disabled={loading}
                >
                  {num}
                </Button>
              )
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === totalPages || loading}
              onClick={() =>
                onPageChange(Math.min(totalPages, currentPage + 1))
              }
            >
              <span className="sr-only">Next</span>
              {'>'}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === totalPages || loading}
              onClick={() => onPageChange(totalPages)}
            >
              <span className="sr-only">Last</span>
              {'>|'}
            </Button>
          </div>
          {/* Enter Page */}
          <form
            className="flex items-center gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              const num = Number(pageInput);
              if (!isNaN(num) && num >= 1 && num <= totalPages) {
                onPageChange(num);
                setPageInput('');
              } else {
                // Optionally: show a toast or error
              }
            }}
          >
            <Input
              type="number"
              min={1}
              max={totalPages}
              value={pageInput}
              onChange={(e) =>
                setPageInput(e.target.value.replace(/[^\d]/g, ''))
              }
              placeholder="Enter Page"
              className="w-28 h-8 px-2 text-xs"
            />
            <Button
              type="submit"
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs"
              disabled={loading || !pageInput}
            >
              Go
            </Button>
          </form>
        </div>
      </div>
      <div className="w-full flex justify-center mt-2">
        <span className="text-xs text-muted-foreground">
          {`Showing ${
            totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1
          } to ${Math.min(
            currentPage * pageSize,
            totalRecords
          )} of ${totalRecords} entries`}
        </span>
      </div>
    </>
  );
};

export default FloatingPagination;