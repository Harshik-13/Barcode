import type { SqlJsDatabase } from './sqljs-adapter';

export type Database = SqlJsDatabase;

export interface DatabaseAdapter {
  init(): Promise<void>;
  getDb(): Database;
  save(): void;
  close(): void;
  prepare(sql: string): {
    run(params?: unknown[]): void;
    get<T = Record<string, unknown>>(params?: unknown[]): T | undefined;
    all<T = Record<string, unknown>>(params?: unknown[]): T[];
    step(): boolean;
    getAsObject<T = Record<string, unknown>>(params?: unknown[]): T;
    free(): void;
  };
  exec(sql: string): void;
}
