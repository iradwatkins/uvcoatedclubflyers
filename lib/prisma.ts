// This project uses raw PostgreSQL queries via pg library
// Re-export the db pool as 'prisma' for compatibility with generated code
import pool, { query } from './db';

export const prisma = {
  // Product queries
  product: {
    findMany: async (options?: any) => {
      let sql = 'SELECT p.*, c.id as "category.id", c.name as "category.name", c.slug as "category.slug" FROM products p LEFT JOIN categories c ON p.category_id = c.id';
      const conditions = [];
      const params: any[] = [];

      if (options?.where?.status !== undefined) {
        conditions.push(`p.status = $${params.length + 1}`);
        params.push(options.where.status);
      }

      if (options?.where?.categoryId !== undefined) {
        conditions.push(`p.category_id = $${params.length + 1}`);
        params.push(options.where.categoryId);
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      if (options?.orderBy?.name) {
        sql += ` ORDER BY p.name ${options.orderBy.name.toUpperCase()}`;
      } else if (options?.orderBy?.createdAt) {
        sql += ` ORDER BY p.created_at ${options.orderBy.createdAt.toUpperCase()}`;
      }

      const result = await query(sql, params);

      // Transform to match Prisma format
      return result.rows.map((row: any) => ({
        ...row,
        basePrice: parseFloat(row.base_price) || 0,
        productType: row.product_type,
        imageUrl: row.image_url,
        categoryId: row.category_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        category: row['category.id'] ? {
          id: row['category.id'],
          name: row['category.name'],
          slug: row['category.slug']
        } : null,
        _count: { orderItems: 0 }
      }));
    },

    findUnique: async (options: any) => {
      const result = await query(
        'SELECT p.*, c.id as "category.id", c.name as "category.name", c.slug as "category.slug" FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = $1',
        [options.where.id]
      );

      if (result.rows.length === 0) return null;

      const row = result.rows[0];

      // Get product options
      const optionsResult = await query(
        'SELECT * FROM product_options WHERE product_id = $1 ORDER BY option_type, sort_order',
        [row.id]
      );

      return {
        ...row,
        basePrice: parseFloat(row.base_price) || 0,
        productType: row.product_type,
        imageUrl: row.image_url,
        categoryId: row.category_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        category: row['category.id'] ? {
          id: row['category.id'],
          name: row['category.name'],
          slug: row['category.slug']
        } : null,
        productOptions: optionsResult.rows.map((opt: any) => ({
          ...opt,
          productId: opt.product_id,
          optionType: opt.option_type,
          optionName: opt.option_name,
          optionValue: opt.option_value,
          priceModifier: parseFloat(opt.price_modifier) || 0,
          isDefault: opt.is_default,
          sortOrder: opt.sort_order,
          createdAt: opt.created_at
        }))
      };
    },

    create: async (data: any) => {
      const result = await query(
        `INSERT INTO products (sku, name, description, base_price, status, product_type, image_url, category_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         RETURNING *`,
        [
          data.sku,
          data.name,
          data.description,
          data.basePrice,
          data.status || 'active',
          data.productType || 'flyer',
          data.imageUrl || null,
          data.categoryId || null
        ]
      );

      const product = result.rows[0];
      return {
        ...product,
        basePrice: parseFloat(product.base_price),
        productType: product.product_type,
        imageUrl: product.image_url,
        categoryId: product.category_id,
        createdAt: product.created_at,
        updatedAt: product.updated_at
      };
    }
  },

  // Category queries
  category: {
    findMany: async (options?: any) => {
      let sql = 'SELECT * FROM categories';
      const conditions = [];
      const params: any[] = [];

      if (options?.where?.isActive !== undefined) {
        conditions.push(`is_active = $${params.length + 1}`);
        params.push(options.where.isActive);
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      if (options?.orderBy?.sortOrder) {
        sql += ` ORDER BY sort_order ${options.orderBy.sortOrder.toUpperCase()}`;
      } else if (options?.orderBy?.name) {
        sql += ` ORDER BY name ${options.orderBy.name.toUpperCase()}`;
      }

      const result = await query(sql, params);
      return result.rows.map((row: any) => ({
        ...row,
        isActive: row.is_active,
        parentId: row.parent_id,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    },

    create: async (data: any) => {
      const result = await query(
        `INSERT INTO categories (name, slug, description, parent_id, sort_order, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING *`,
        [
          data.name,
          data.slug,
          data.description || null,
          data.parentId || null,
          data.sortOrder || 0,
          data.isActive !== undefined ? data.isActive : true
        ]
      );

      const category = result.rows[0];
      return {
        ...category,
        isActive: category.is_active,
        parentId: category.parent_id,
        sortOrder: category.sort_order,
        createdAt: category.created_at,
        updatedAt: category.updated_at
      };
    }
  },

  // Product Options queries
  productOption: {
    createMany: async (data: any) => {
      const { data: options } = data;
      const results = [];

      for (const option of options) {
        const result = await query(
          `INSERT INTO product_options (product_id, option_type, option_name, option_value, price_modifier, is_default, sort_order, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
           RETURNING *`,
          [
            option.productId,
            option.optionType,
            option.optionName,
            option.optionValue,
            option.priceModifier || 0,
            option.isDefault || false,
            option.sortOrder || 0
          ]
        );
        results.push(result.rows[0]);
      }

      return { count: results.length };
    }
  },


  // Order queries
  order: {
    create: async (data: any) => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const orderResult = await client.query(
          `INSERT INTO orders (order_number, user_id, status, subtotal, tax_amount, total_amount, payment_id, payment_method, payment_status, billing_info, shipping_address, shipping_carrier, shipping_service, shipping_rate_amount, pickup_airport_id, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
           RETURNING *`,
          [
            data.data.orderNumber,
            data.data.userId,
            data.data.status,
            data.data.subtotal,
            data.data.taxAmount,
            data.data.totalAmount,
            data.data.paymentId,
            data.data.paymentMethod || 'card',
            data.data.paymentStatus,
            data.data.billingInfo ? JSON.stringify(data.data.billingInfo) : null,
            data.data.shippingAddress ? JSON.stringify(data.data.shippingAddress) : null,
            data.data.shippingCarrier || null,
            data.data.shippingService || null,
            data.data.shippingRateAmount || null,
            data.data.pickupAirportId || null
          ]
        );

        const order = orderResult.rows[0];

        // Insert order items
        for (const item of data.data.orderItems.create) {
          await client.query(
            `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, options, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
            [
              order.id,
              item.productId,
              item.quantity,
              item.unitPrice,
              item.totalPrice,
              JSON.stringify(item.options)
            ]
          );
        }

        await client.query('COMMIT');

        return {
          ...order,
          orderNumber: order.order_number,
          userId: order.user_id,
          subtotal: parseInt(order.subtotal),
          taxAmount: parseInt(order.tax_amount),
          totalAmount: parseInt(order.total_amount),
          paymentId: order.payment_id,
          paymentStatus: order.payment_status,
          createdAt: order.created_at,
          updatedAt: order.updated_at
        };
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    },

    findUnique: async (options: any) => {
      const result = await query('SELECT * FROM orders WHERE id = $1', [options.where.id]);
      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        ...row,
        orderNumber: row.order_number,
        userId: row.user_id,
        subtotal: parseInt(row.subtotal),
        taxAmount: parseInt(row.tax_amount),
        totalAmount: parseInt(row.total_amount),
        paymentId: row.payment_id,
        paymentStatus: row.payment_status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    },

    findMany: async (options?: any) => {
      const result = await query('SELECT * FROM orders ORDER BY created_at DESC');
      return result.rows.map((row: any) => ({
        ...row,
        orderNumber: row.order_number,
        userId: row.user_id,
        subtotal: parseInt(row.subtotal),
        taxAmount: parseInt(row.tax_amount),
        totalAmount: parseInt(row.total_amount),
        paymentId: row.payment_id,
        paymentStatus: row.payment_status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        user: null,
        orderItems: []
      }));
    }
  }
};

export default prisma;
