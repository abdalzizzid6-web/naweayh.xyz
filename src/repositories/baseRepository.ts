import { IRepository, PaginationOptions, PaginatedResult } from '../core';
import { LocalStorageAdapter } from '../infrastructure';

export type { PaginationOptions, PaginatedResult };

export abstract class BaseRepository<T extends { id: string }> implements IRepository<T> {
  protected storageKey: string;

  constructor(storageKey: string) {
    this.storageKey = storageKey;
  }

  protected getStoredItems(): T[] {
    return LocalStorageAdapter.getItem<T>(this.storageKey);
  }

  protected setStoredItems(items: T[]): void {
    LocalStorageAdapter.setItem<T>(this.storageKey, items);
  }

  public getAll(): T[] {
    return this.getStoredItems();
  }

  public getById(id: string): T | undefined {
    return this.getStoredItems().find((item) => item.id === id);
  }

  public getPaginated(options: PaginationOptions): PaginatedResult<T> {
    const items = this.getStoredItems();
    const limit = Math.max(1, options.limit);
    const page = Math.max(1, options.page);
    const start = (page - 1) * limit;
    const paginatedData = items.slice(start, start + limit);
    const totalPages = Math.ceil(items.length / limit) || 1;

    return {
      data: paginatedData,
      total: items.length,
      page,
      totalPages,
    };
  }

  public add(item: T): T {
    const items = this.getStoredItems();
    const updated = [item, ...items];
    this.setStoredItems(updated);
    return item;
  }

  public update(id: string, updates: Partial<T>): T | undefined {
    const items = this.getStoredItems();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return undefined;

    const updatedItem = { ...items[index], ...updates };
    const newItems = [...items];
    newItems[index] = updatedItem;
    this.setStoredItems(newItems);
    return updatedItem;
  }

  public delete(id: string): boolean {
    const items = this.getStoredItems();
    const filtered = items.filter((item) => item.id !== id);
    if (filtered.length === items.length) return false;
    this.setStoredItems(filtered);
    return true;
  }
}
