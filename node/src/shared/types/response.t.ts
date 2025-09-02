export type Data =
  | string
  | {
      [key: string]: any;
    };

export interface Pagination {
  total_records: number;
  current_page: number;
  total_pages: number;
}
