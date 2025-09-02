import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from './pagination';

interface PaginationWithLogicProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const PaginationWithLogic: React.FC<PaginationWithLogicProps> = ({
  totalPages,
  currentPage,
  onPageChange,
  className,
}) => {
  // Ellipsis logic
  const getPageNumbers = () => {
    const pageNeighbours = 1;
    const totalNumbers = pageNeighbours * 2 + 3;
    const totalBlocks = totalNumbers + 2;
    if (totalPages > totalBlocks) {
      const startPage = Math.max(2, currentPage - pageNeighbours);
      const endPage = Math.min(totalPages - 1, currentPage + pageNeighbours);
      let pages: (string | number)[] = Array.from(
        { length: endPage - startPage + 1 },
        (_, i) => startPage + i
      );
      const hasLeftSpill = startPage > 2;
      const hasRightSpill = totalPages - endPage > 1;
      const spillOffset = totalNumbers - (pages.length + 1);
      switch (true) {
        case hasLeftSpill && !hasRightSpill: {
          const extraPages = Array.from(
            { length: spillOffset },
            (_, i) => startPage - 1 - i
          ).reverse();
          pages = ['...', ...extraPages, ...pages];
          break;
        }
        case !hasLeftSpill && hasRightSpill: {
          const extraPages = Array.from(
            { length: spillOffset },
            (_, i) => endPage + 1 + i
          );
          pages = [...pages, ...extraPages, '...'];
          break;
        }
        case hasLeftSpill && hasRightSpill:
        default: {
          pages = ['...', ...pages, '...'];
          break;
        }
      }
      return [1, ...pages, totalPages];
    }
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  };

  const pageNumbers = getPageNumbers();

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className={
              currentPage === 1
                ? 'pointer-events-none text-muted-foreground'
                : undefined
            }
          />
        </PaginationItem>
        {pageNumbers.map((page, index) => (
          <PaginationItem key={`${page}-${index}`}>
            {typeof page === 'number' ? (
              <PaginationLink
                isActive={currentPage === page}
                onClick={() => onPageChange(page)}
                className={
                  currentPage === page
                    ? 'bg-[hsl(var(--razor-primary))] text-white'
                    : 'bg-transparent text-primary'
                }
              >
                {page}
              </PaginationLink>
            ) : (
              <PaginationEllipsis />
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className={
              currentPage === totalPages
                ? 'pointer-events-none text-muted-foreground'
                : undefined
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default PaginationWithLogic;
