/**
 * Utility function to parse pasted content from spreadsheets or tabular data
 * and extract individual items as an array of strings
 */

export interface ParsePasteOptions {
  /** Separator to use for splitting items within cells (default: comma) */
  itemSeparator?: string;
  /** Whether to trim whitespace from each item (default: true) */
  trimItems?: boolean;
  /** Whether to filter out empty items (default: true) */
  filterEmpty?: boolean;
  /** Whether to convert to lowercase (default: false) */
  toLowerCase?: boolean;
  /** Maximum number of items to return (default: no limit) */
  maxItems?: number;
}

/**
 * Parses pasted content and extracts individual items
 * Handles various formats:
 * - Tab-separated values (from spreadsheets)
 * - Comma-separated values
 * - Line-separated values
 * - Mixed formats
 */
export function parsePastedContent(
  pastedText: string,
  options: ParsePasteOptions = {}
): string[] {
  const {
    itemSeparator = ',',
    trimItems = true,
    filterEmpty = true,
    toLowerCase = false,
    maxItems,
  } = options;

  if (!pastedText || typeof pastedText !== 'string') {
    return [];
  }

  // Split by common separators: tabs, newlines, and custom separator
  const items = pastedText
    .split(/[\t\n\r]+/) // Split by tabs and newlines first (spreadsheet format)
    .flatMap(
      (line) => line.split(itemSeparator) // Then split by item separator within each line
    )
    .map((item) => {
      let processed = item;

      // Remove quotes that might be added by spreadsheet applications
      processed = processed.replace(/^["']|["']$/g, '');

      if (trimItems) {
        processed = processed.trim();
      }

      if (toLowerCase) {
        processed = processed.toLowerCase();
      }

      return processed;
    });

  // Filter out empty items if requested
  const filteredItems = filterEmpty
    ? items.filter((item) => item.length > 0)
    : items;

  // Apply max items limit if specified
  return maxItems ? filteredItems.slice(0, maxItems) : filteredItems;
}

/**
 * Hook for handling paste events in input fields
 * Returns a function that can be used as an onPaste handler
 */
export function usePasteHandler(
  onItemsExtracted: (items: string[]) => void,
  options: ParsePasteOptions = {}
) {
  return (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = event.clipboardData.getData('text');

    // Only process if it looks like tabular data (contains tabs or multiple lines)
    if (pastedText.includes('\t') || pastedText.includes('\n')) {
      event.preventDefault();

      const items = parsePastedContent(pastedText, options);

      if (items.length > 0) {
        onItemsExtracted(items);
      }
    }
    // If it's just regular text, let the default paste behavior handle it
  };
}

/**
 * Detects if pasted content is likely from a spreadsheet
 */
export function isSpreadsheetData(text: string): boolean {
  return (
    text.includes('\t') || (text.includes('\n') && text.split('\n').length > 1)
  );
}
