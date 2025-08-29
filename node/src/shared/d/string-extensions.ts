/* eslint-disable no-extend-native */
declare global {
  interface String {
    capitalizeEvery(): string;
  }
}

/**
 * @description This function would capitalize every word in the string
 * @returns
 */
String.prototype.capitalizeEvery = function (this: string): string {
  return this.toString()
    .split(' ')
    .map(
      (word: string): string =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(' ');
};
