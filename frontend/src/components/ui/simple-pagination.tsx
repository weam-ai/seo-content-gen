import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showJumpToPage?: boolean;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [10, 20, 50, 100, -1],
  showPageSizeSelector = true,
  showJumpToPage = true,
  className = '',
}) => {
  const [jumpToPageValue, setJumpToPageValue] = useState('');
  const totalPages = (itemsPerPage === 0 || itemsPerPage === -1) ? 1 : Math.ceil(totalItems / itemsPerPage);
  const startItem = (itemsPerPage === 0 || itemsPerPage === -1) ? 1 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = (itemsPerPage === 0 || itemsPerPage === -1) ? totalItems : Math.min(currentPage * itemsPerPage, totalItems);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pageNumbers: (number | string)[] = [];

    if (currentPage <= 4) {
      // Show first 5 pages + ellipsis + last page
      pageNumbers.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (currentPage >= totalPages - 3) {
      // Show first page + ellipsis + last 5 pages
      pageNumbers.push(
        1,
        '...',
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      );
    } else {
      // Show first page + ellipsis + current-1, current, current+1 + ellipsis + last page
      pageNumbers.push(
        1,
        '...',
        currentPage - 1,
        currentPage,
        currentPage + 1,
        '...',
        totalPages
      );
    }

    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  // Handle jump to page
  const handleJumpToPage = () => {
    const pageNumber = parseInt(jumpToPageValue);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      onPageChange(pageNumber);
      setJumpToPageValue('');
    }
  };

  const handleJumpToPageKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJumpToPage();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top Row: Page Size Selector */}
      {showPageSizeSelector && onItemsPerPageChange && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show:</span>
          <Select
            value={String(itemsPerPage)}
            onValueChange={(value) => onItemsPerPageChange(Number(value))}
          >
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size === 0 || size === -1 ? 'Max' : size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            entries per page
          </span>
        </div>
      )}

      {/* Bottom Row: Pagination Controls */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-muted-foreground">
          {(itemsPerPage === 0 || itemsPerPage === -1)
            ? `Showing all ${totalItems} entries`
            : `Showing ${startItem} to ${endItem} of ${totalItems} entries`
          }
        </p>

        <div className="flex items-center gap-4">
          {/* Jump to Page */}
          {showJumpToPage && totalPages > 1 && itemsPerPage !== -1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Go to:</span>
              <Input
                type="number"
                min={1}
                max={totalPages}
                value={jumpToPageValue}
                onChange={(e) => setJumpToPageValue(e.target.value)}
                onKeyPress={handleJumpToPageKeyPress}
                placeholder={String(currentPage)}
                className="w-16 h-8 text-center"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleJumpToPage}
                disabled={
                  !jumpToPageValue ||
                  parseInt(jumpToPageValue) < 1 ||
                  parseInt(jumpToPageValue) > totalPages
                }
                className="h-8 px-2"
              >
                Go
              </Button>
            </div>
          )}

          {/* Page Navigation */}
          {itemsPerPage !== -1 && itemsPerPage !== 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!canGoPrevious}
                className="h-8 px-3"
                onClick={() => canGoPrevious && onPageChange(currentPage - 1)}
              >
                Previous
              </Button>

              {/* Page numbers with ellipses */}
              {pageNumbers.map((page, index) => (
                <React.Fragment key={`${page}-${index}`}>
                  {typeof page === 'number' ? (
                    <Button
                      size="sm"
                      variant={currentPage === page ? 'default' : 'outline'}
                      className={`h-8 px-3 ${currentPage === page
                        ? 'bg-[hsl(var(--razor-primary))] text-white'
                        : ''
                        }`}
                      onClick={() => onPageChange(page)}
                    >
                      {page}
                    </Button>
                  ) : (
                    <span className="text-muted-foreground px-2 text-sm select-none">
                      {page}
                    </span>
                  )}
                </React.Fragment>
              ))}

              <Button
                variant="outline"
                size="sm"
                disabled={!canGoNext}
                className="h-8 px-3"
                onClick={() => canGoNext && onPageChange(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
