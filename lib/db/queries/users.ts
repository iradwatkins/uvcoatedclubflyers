import { query } from '../index';
import { hash } from 'bcryptjs';

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: 'customer' | 'staff' | 'admin';
}

export async function createUser(data: CreateUserData) {
  const { email, password, name, phone, role = 'customer' } = data;

  // Check if user already exists
  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);

  if (existing.rows.length > 0) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const password_hash = await hash(password, 12);

  // Create user
  const result = await query(
    `INSERT INTO users (email, password_hash, name, phone, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, name, phone, role, created_at`,
    [email, password_hash, name, phone || null, role]
  );

  return result.rows[0];
}

export async function getUserByEmail(email: string) {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);

  return result.rows[0] || null;
}

export async function getUserById(id: number | string) {
  const result = await query(
    'SELECT id, email, name, phone, role, image, created_at FROM users WHERE id = $1',
    [id]
  );

  return result.rows[0] || null;
}

export async function updateUser(id: number | string, data: Partial<CreateUserData>) {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && key !== 'password') {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  });

  if (data.password) {
    const password_hash = await hash(data.password, 12);
    fields.push(`password_hash = $${paramCount}`);
    values.push(password_hash);
    paramCount++;
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);

  const result = await query(
    `UPDATE users
     SET ${fields.join(', ')}
     WHERE id = $${paramCount}
     RETURNING id, email, name, phone, role, image, updated_at`,
    values
  );

  return result.rows[0];
}
