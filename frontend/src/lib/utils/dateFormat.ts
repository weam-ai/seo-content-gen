/**
 * Common date formatting utilities for version history and editor components
 */

/**
 * Format date for version dropdown - shows detailed timestamp information
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export const formatVersionDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  // If less than 24 hours ago, show relative time
  if (diffInHours < 24) {
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
    }
    return `${Math.floor(diffInHours)}h ago`;
  }

  // If less than 7 days ago, show day and time
  if (diffInHours < 24 * 7) {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  // Otherwise show full date and time
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format date for version history section - shows simple relative time
 * @param date - Date object
 * @returns Formatted relative time string
 */
export const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInHours = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  );

  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`;

  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths}mo ago`;
};

/**
 * Format date for detailed display - shows full date and time
 * @param dateString - ISO date string or Date object
 * @returns Formatted full date string
 */
export const formatFullDate = (dateString: string | Date): string => {
  const date =
    typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};
