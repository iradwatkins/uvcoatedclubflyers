/**
 * Prisma Adapter for UV Coated Club Flyers
 * Provides Prisma-like API using raw PostgreSQL queries
 *
 * This adapter allows the shipping library (which uses Prisma) to work with our raw SQL setup
 */

import pool from './index';

// Type definitions matching Prisma's Airport model
export interface Airport {
  id: string;
  code: string;
  name: string;
  carrier: string;
  operator: string | null;
  address: string;
  city: string;
  state: string;
  zip: string;
  hours: Record<string, string>;
  isActive: boolean;
  latitude: number | null;
  longitude: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AirportWhereInput {
  carrier?: string;
  isActive?: boolean;
  state?: string;
  code?: string;
  id?: string;
}

export interface AirportFindManyArgs {
  where?: AirportWhereInput;
  select?: Partial<Record<keyof Airport, boolean>>;
  distinct?: Array<keyof Airport>;
  orderBy?: Partial<Record<keyof Airport, 'asc' | 'desc'>>;
  take?: number;
  skip?: number;
}

export interface AirportFindUniqueArgs {
  where: {
    id?: string;
    code?: string;
  };
  select?: Partial<Record<keyof Airport, boolean>>;
}

/**
 * Build WHERE clause from Prisma-like where input
 */
function buildWhereClause(where?: AirportWhereInput): { clause: string; params: any[] } {
  if (!where || Object.keys(where).length === 0) {
    return { clause: '', params: [] };
  }

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (where.carrier !== undefined) {
    conditions.push(`carrier = $${paramIndex++}`);
    params.push(where.carrier);
  }

  if (where.isActive !== undefined) {
    conditions.push(`is_active = $${paramIndex++}`);
    params.push(where.isActive);
  }

  if (where.state !== undefined) {
    conditions.push(`state = $${paramIndex++}`);
    params.push(where.state);
  }

  if (where.code !== undefined) {
    conditions.push(`code = $${paramIndex++}`);
    params.push(where.code);
  }

  if (where.id !== undefined) {
    conditions.push(`id = $${paramIndex++}`);
    params.push(where.id);
  }

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { clause, params };
}

/**
 * Build SELECT fields from Prisma-like select input
 */
function buildSelectFields(select?: Partial<Record<keyof Airport, boolean>>): string {
  if (!select || Object.keys(select).length === 0) {
    return '*';
  }

  const fields = Object.keys(select).filter((key) => select[key as keyof Airport]);

  // Convert camelCase to snake_case for database columns
  const dbFields = fields.map((field) => {
    switch (field) {
      case 'isActive':
        return 'is_active';
      case 'createdAt':
        return 'created_at';
      case 'updatedAt':
        return 'updated_at';
      default:
        return field;
    }
  });

  return dbFields.join(', ');
}

/**
 * Convert database row to Airport object (snake_case to camelCase)
 */
function rowToAirport(row: any): Airport {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    carrier: row.carrier,
    operator: row.operator,
    address: row.address,
    city: row.city,
    state: row.state,
    zip: row.zip,
    hours: row.hours,
    isActive: row.is_active,
    latitude: row.latitude,
    longitude: row.longitude,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Prisma-compatible Airport model adapter
 */
export const airport = {
  /**
   * Find many airports (like Prisma's findMany)
   */
  async findMany(args: AirportFindManyArgs = {}): Promise<Partial<Airport>[]> {
    const { where, select, distinct, orderBy, take, skip } = args;

    const selectFields = buildSelectFields(select);
    const { clause: whereClause, params } = buildWhereClause(where);

    // Build DISTINCT clause
    let distinctClause = '';
    if (distinct && distinct.length > 0) {
      const distinctFields = distinct.map((field) => {
        switch (field) {
          case 'isActive':
            return 'is_active';
          case 'createdAt':
            return 'created_at';
          case 'updatedAt':
            return 'updated_at';
          default:
            return field as string;
        }
      });
      distinctClause = `DISTINCT ON (${distinctFields.join(', ')})`;
    }

    // Build ORDER BY clause
    let orderByClause = '';
    if (orderBy && Object.keys(orderBy).length > 0) {
      const orderFields = Object.entries(orderBy).map(([field, direction]) => {
        const dbField =
          field === 'isActive'
            ? 'is_active'
            : field === 'createdAt'
              ? 'created_at'
              : field === 'updatedAt'
                ? 'updated_at'
                : field;
        return `${dbField} ${direction?.toUpperCase()}`;
      });
      orderByClause = `ORDER BY ${orderFields.join(', ')}`;
    }

    // Build LIMIT/OFFSET clause
    let limitClause = '';
    if (take !== undefined) {
      limitClause += ` LIMIT ${take}`;
    }
    if (skip !== undefined) {
      limitClause += ` OFFSET ${skip}`;
    }

    const query = `
      SELECT ${distinctClause} ${selectFields}
      FROM airports
      ${whereClause}
      ${orderByClause}
      ${limitClause}
    `.trim();

    const result = await pool.query(query, params);

    // If select is specified, return partial objects
    if (select && Object.keys(select).length > 0) {
      return result.rows.map((row) => {
        const airport: any = {};
        Object.keys(select).forEach((key) => {
          const dbKey =
            key === 'isActive'
              ? 'is_active'
              : key === 'createdAt'
                ? 'created_at'
                : key === 'updatedAt'
                  ? 'updated_at'
                  : key;
          airport[key] = row[dbKey];
        });
        return airport;
      });
    }

    return result.rows.map(rowToAirport);
  },

  /**
   * Find unique airport (like Prisma's findUnique)
   */
  async findUnique(args: AirportFindUniqueArgs): Promise<Partial<Airport> | null> {
    const { where, select } = args;

    if (!where.id && !where.code) {
      throw new Error('findUnique requires either id or code');
    }

    const selectFields = buildSelectFields(select);
    const { clause: whereClause, params } = buildWhereClause(where);

    const query = `
      SELECT ${selectFields}
      FROM airports
      ${whereClause}
      LIMIT 1
    `.trim();

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return null;
    }

    // If select is specified, return partial object
    if (select && Object.keys(select).length > 0) {
      const airport: any = {};
      Object.keys(select).forEach((key) => {
        const dbKey =
          key === 'isActive'
            ? 'is_active'
            : key === 'createdAt'
              ? 'created_at'
              : key === 'updatedAt'
                ? 'updated_at'
                : key;
        airport[key] = result.rows[0][dbKey];
      });
      return airport;
    }

    return rowToAirport(result.rows[0]);
  },

  /**
   * Count airports (like Prisma's count)
   */
  async count(args: { where?: AirportWhereInput } = {}): Promise<number> {
    const { where } = args;
    const { clause: whereClause, params } = buildWhereClause(where);

    const query = `
      SELECT COUNT(*) as count
      FROM airports
      ${whereClause}
    `.trim();

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count);
  },
};

/**
 * Export a Prisma-like client
 */
export const prisma = {
  airport,
};
