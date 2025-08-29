/**
 *
 * @param titles - Array of titles to be formatted
 * @description
 * This function takes an array of titles and formats them by removing leading numbers and punctuation,
 * as well as removing double quotes. It returns a new array of formatted titles.
 * @returns
 */
export function formatedTitles(titles: string[]) {
  return titles
    .map(
      (title) =>
        title
          .trim()
          .replace(/^\d+[-.]\s*/, '') // Remove leading numbers and punctuation
          .replace(/"/g, ''), // Remove double quotes
    )
    .filter((title) => title !== '');
}
