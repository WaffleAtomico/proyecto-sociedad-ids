/**
 * In-memory stand-in for the Supabase client used by the API routes.
 *
 * Every query is recorded in `calls` and returns the next queued result,
 * which keeps the route tests fast and completely offline.
 */

export interface DatabaseResult {
  data?: unknown;
  error?: { message?: string; code?: string } | null;
}

export interface DatabaseCall {
  table: string;
  operation: "select" | "insert" | "update" | "delete";
  payload?: unknown;
  selected?: string;
  filters: [string, unknown][];
  order?: { column: string; options?: unknown };
}

export class DatabaseUnavailableError extends Error {
  constructor(message = "La base de datos no está disponible.") {
    super(message);
    this.name = "DatabaseUnavailableError";
  }
}

function createDatabaseMock() {
  const results: DatabaseResult[] = [];
  const calls: DatabaseCall[] = [];
  let connectError: Error | null = null;

  const db = {
    calls,
    queue(...nextResults: DatabaseResult[]) {
      results.push(...nextResults);
      return db;
    },
    reset() {
      results.length = 0;
      calls.length = 0;
      connectError = null;
    },
    failConnect(error: Error) {
      connectError = error;
    },
    async connect() {
      if (connectError) throw connectError;
      return db;
    },
    async checkConnection() {
      if (connectError) throw connectError;
    },
    from(table: string) {
      const call: DatabaseCall = {
        table,
        operation: "select",
        filters: [],
      };
      calls.push(call);

      const next = (): DatabaseResult =>
        results.length > 0
          ? results.shift()!
          : { data: null, error: null };

      const query = {
        select(columns?: string) {
          call.selected = columns;
          return query;
        },
        insert(payload: unknown) {
          call.operation = "insert";
          call.payload = payload;
          return query;
        },
        update(payload: unknown) {
          call.operation = "update";
          call.payload = payload;
          return query;
        },
        delete() {
          call.operation = "delete";
          return query;
        },
        eq(column: string, value: unknown) {
          call.filters.push([column, value]);
          return query;
        },
        order(column: string, options?: unknown) {
          call.order = { column, options };
          return query;
        },
        limit() {
          return query;
        },
        single() {
          return Promise.resolve(next());
        },
        maybeSingle() {
          return Promise.resolve(next());
        },
        then(
          onFulfilled?: (value: DatabaseResult) => unknown,
          onRejected?: (reason: unknown) => unknown
        ) {
          return Promise.resolve(next()).then(onFulfilled, onRejected);
        },
      };

      return query;
    },
  };

  return db;
}

export const databaseMock = createDatabaseMock();

export type DatabaseMock = ReturnType<typeof createDatabaseMock>;
