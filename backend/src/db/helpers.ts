import pool from "./pool";

// ─── Case conversion ──────────────────────────────────────────────────────────

export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function normalizeQueryKey(key: string): string {
  return key === "_id" ? "id" : key;
}

export function mapRow(row: any): any {
  if (!row) return null;
  const result: any = {};
  for (const [key, value] of Object.entries(row)) {
    result[snakeToCamel(key)] = value;
  }
  if (result.id) result._id = result.id;
  return result;
}

// ─── WHERE builder ────────────────────────────────────────────────────────────

export function buildWhere(
  filter: Record<string, any>,
  startIndex = 1,
): { where: string; params: any[]; nextIndex: number } {
  const conditions: string[] = [];
  const params: any[] = [];
  let idx = startIndex;

  for (const [key, value] of Object.entries(filter)) {
    if (key === "$or") {
      const orParts: string[] = [];
      for (const subFilter of value as Record<string, any>[]) {
        const sub = buildWhere(subFilter, idx);
        orParts.push(`(${sub.where.replace(/^WHERE /, "")})`);
        params.push(...sub.params);
        idx = sub.nextIndex;
      }
      conditions.push(`(${orParts.join(" OR ")})`);
      continue;
    }

    const col = camelToSnake(normalizeQueryKey(key));

    if (value === null || value === undefined) {
      conditions.push(`${col} IS NULL`);
      continue;
    }

    if (value instanceof RegExp) {
      params.push(value.source);
      conditions.push(`${col} ILIKE '%' || $${idx} || '%'`);
      idx++;
      continue;
    }

    if (typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
      for (const [op, val] of Object.entries(value)) {
        switch (op) {
          case "$gt":
            params.push(val);
            conditions.push(`${col} > $${idx++}`);
            break;
          case "$gte":
            params.push(val);
            conditions.push(`${col} >= $${idx++}`);
            break;
          case "$lt":
            params.push(val);
            conditions.push(`${col} < $${idx++}`);
            break;
          case "$lte":
            params.push(val);
            conditions.push(`${col} <= $${idx++}`);
            break;
          case "$in":
            params.push(val);
            conditions.push(`${col} = ANY($${idx++})`);
            break;
          case "$ne":
            params.push(val);
            conditions.push(`${col} != $${idx++}`);
            break;
        }
      }
      continue;
    }

    params.push(value);
    conditions.push(`${col} = $${idx++}`);
  }

  return {
    where: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
    nextIndex: idx,
  };
}

// ─── INSERT builder ───────────────────────────────────────────────────────────

export function buildInsert(data: Record<string, any>): {
  columns: string;
  placeholders: string;
  params: any[];
} {
  const columns: string[] = [];
  const placeholders: string[] = [];
  const params: any[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    columns.push(camelToSnake(key));
    params.push(value);
    placeholders.push(`$${params.length}`);
  }

  return { columns: columns.join(", "), placeholders: placeholders.join(", "), params };
}

// ─── UPDATE SET builder ───────────────────────────────────────────────────────

export function buildSet(
  data: Record<string, any>,
  startIndex = 1,
): { sets: string; params: any[]; nextIndex: number } {
  const setParts: string[] = [];
  const params: any[] = [];
  let idx = startIndex;

  for (const [key, value] of Object.entries(data)) {
    if (key === "$push") {
      for (const [field, val] of Object.entries(value as Record<string, any>)) {
        const col = camelToSnake(normalizeQueryKey(field));
        params.push(val);
        setParts.push(`${col} = array_append(${col}, $${idx++})`);
      }
      continue;
    }

    if (value === undefined) continue;
    const col = camelToSnake(normalizeQueryKey(key));
    params.push(value === null ? null : value);
    setParts.push(`${col} = $${idx++}`);
  }

  return { sets: setParts.join(", "), params, nextIndex: idx };
}

// ─── FindBuilder (fluent query) ───────────────────────────────────────────────

export class FindBuilder<T = any> {
  private _baseSql: string;
  private _baseParams: any[];
  private _orderBy = "";
  private _limit = "";
  private _offset = "";
  private _mapFn: (row: any) => T;

  constructor(baseSql: string, baseParams: any[], mapFn: (row: any) => T) {
    this._baseSql = baseSql;
    this._baseParams = baseParams;
    this._mapFn = mapFn;
  }

  sort(obj: Record<string, number>): this {
    const parts = Object.entries(obj).map(
      ([k, v]) => `${camelToSnake(normalizeQueryKey(k))} ${v > 0 ? "ASC" : "DESC"}`,
    );
    this._orderBy = `ORDER BY ${parts.join(", ")}`;
    return this;
  }

  limit(n: number): this {
    this._limit = `LIMIT ${n}`;
    return this;
  }

  skip(n: number): this {
    this._offset = `OFFSET ${n}`;
    return this;
  }

  select(_fields: string): this {
    return this;
  }

  lean(): this {
    return this;
  }

  populate(_field: string, _subFields?: string): this {
    return this;
  }

  private buildSql(): string {
    return [this._baseSql, this._orderBy, this._limit, this._offset]
      .filter(Boolean)
      .join(" ");
  }

  then<R>(
    onfulfilled: (value: T[]) => R | PromiseLike<R>,
    onrejected?: (reason: any) => R | PromiseLike<R>,
  ): Promise<R> {
    return pool
      .query(this.buildSql(), this._baseParams)
      .then((result) => onfulfilled(result.rows.map(this._mapFn)), onrejected);
  }

  async toArray(): Promise<T[]> {
    const result = await pool.query(this.buildSql(), this._baseParams);
    return result.rows.map(this._mapFn);
  }
}
