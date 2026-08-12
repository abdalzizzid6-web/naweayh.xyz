export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface IRepository<T extends { id: string }> {
  getAll(): T[];
  getById(id: string): T | undefined;
  getPaginated(options: PaginationOptions): PaginatedResult<T>;
  add(item: T): T;
  update(id: string, updates: Partial<T>): T | undefined;
  delete(id: string): boolean;
}
