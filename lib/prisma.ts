// This project uses raw PostgreSQL queries via pg library
// Re-export the db pool as 'prisma' for compatibility with generated code
import pool, { query } from './db';

export const prisma = {
  // Product queries
  product: {
    findMany: async (options?: any) => {
      let sql =
        'SELECT p.*, c.id as "category.id", c.name as "category.name", c.slug as "category.slug" FROM products p LEFT JOIN categories c ON p.category_id = c.id';
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
        quantities: row.quantities,
        sizes: row.sizes,
        availablePaperStocks: row.available_paper_stocks,
        availableTurnarounds: row.available_turnarounds,
        mandatoryAddons: row.mandatory_addons,
        availableAddons: row.available_addons,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        category: row['category.id']
          ? {
              id: row['category.id'],
              name: row['category.name'],
              slug: row['category.slug'],
            }
          : null,
        _count: { orderItems: 0 },
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
        quantities: row.quantities,
        sizes: row.sizes,
        availablePaperStocks: row.available_paper_stocks,
        availableTurnarounds: row.available_turnarounds,
        mandatoryAddons: row.mandatory_addons,
        availableAddons: row.available_addons,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        category: row['category.id']
          ? {
              id: row['category.id'],
              name: row['category.name'],
              slug: row['category.slug'],
            }
          : null,
        productOptions: optionsResult.rows.map((opt: any) => ({
          ...opt,
          productId: opt.product_id,
          optionType: opt.option_type,
          optionName: opt.option_name,
          optionValue: opt.option_value,
          priceModifier: parseFloat(opt.price_modifier) || 0,
          isDefault: opt.is_default,
          sortOrder: opt.sort_order,
          createdAt: opt.created_at,
        })),
      };
    },

    create: async (data: any) => {
      const result = await query(
        `INSERT INTO products (sku, name, description, base_price, status, product_type, image_url, category_id, quantities, sizes, available_paper_stocks, available_turnarounds, mandatory_addons, available_addons, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
         RETURNING *`,
        [
          data.sku,
          data.name,
          data.description,
          data.basePrice,
          data.status || 'active',
          data.productType || 'flyer',
          data.imageUrl || null,
          data.categoryId || null,
          data.quantities || '25,50,100,250,500,1000,2500,5000',
          data.sizes || '4x6,5x7,6x9,8.5x11',
          data.availablePaperStocks ? JSON.stringify(data.availablePaperStocks) : '[]',
          data.availableTurnarounds ? JSON.stringify(data.availableTurnarounds) : '[]',
          data.mandatoryAddons ? JSON.stringify(data.mandatoryAddons) : '[]',
          data.availableAddons ? JSON.stringify(data.availableAddons) : '[]',
        ]
      );

      const product = result.rows[0];
      return {
        ...product,
        basePrice: parseFloat(product.base_price),
        productType: product.product_type,
        imageUrl: product.image_url,
        categoryId: product.category_id,
        quantities: product.quantities,
        sizes: product.sizes,
        availablePaperStocks: product.available_paper_stocks,
        availableTurnarounds: product.available_turnarounds,
        mandatoryAddons: product.mandatory_addons,
        availableAddons: product.available_addons,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
      };
    },

    update: async (options: any) => {
      const { where, data } = options;
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // Build dynamic update query
      if (data.sku !== undefined) {
        updates.push(`sku = $${paramIndex++}`);
        values.push(data.sku);
      }
      if (data.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(data.name);
      }
      if (data.description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(data.description);
      }
      if (data.basePrice !== undefined) {
        updates.push(`base_price = $${paramIndex++}`);
        values.push(data.basePrice);
      }
      if (data.status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        values.push(data.status);
      }
      if (data.productType !== undefined) {
        updates.push(`product_type = $${paramIndex++}`);
        values.push(data.productType);
      }
      if (data.imageUrl !== undefined) {
        updates.push(`image_url = $${paramIndex++}`);
        values.push(data.imageUrl);
      }
      if (data.categoryId !== undefined) {
        updates.push(`category_id = $${paramIndex++}`);
        values.push(data.categoryId);
      }
      if (data.quantities !== undefined) {
        updates.push(`quantities = $${paramIndex++}`);
        values.push(data.quantities);
      }
      if (data.sizes !== undefined) {
        updates.push(`sizes = $${paramIndex++}`);
        values.push(data.sizes);
      }
      if (data.availablePaperStocks !== undefined) {
        updates.push(`available_paper_stocks = $${paramIndex++}`);
        values.push(JSON.stringify(data.availablePaperStocks));
      }
      if (data.availableTurnarounds !== undefined) {
        updates.push(`available_turnarounds = $${paramIndex++}`);
        values.push(JSON.stringify(data.availableTurnarounds));
      }
      if (data.mandatoryAddons !== undefined) {
        updates.push(`mandatory_addons = $${paramIndex++}`);
        values.push(JSON.stringify(data.mandatoryAddons));
      }
      if (data.availableAddons !== undefined) {
        updates.push(`available_addons = $${paramIndex++}`);
        values.push(JSON.stringify(data.availableAddons));
      }

      updates.push(`updated_at = NOW()`);
      values.push(where.id);

      const result = await query(
        `UPDATE products SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );

      if (result.rows.length === 0) return null;

      const product = result.rows[0];
      return {
        ...product,
        basePrice: parseFloat(product.base_price),
        productType: product.product_type,
        imageUrl: product.image_url,
        categoryId: product.category_id,
        quantities: product.quantities,
        sizes: product.sizes,
        availablePaperStocks: product.available_paper_stocks,
        availableTurnarounds: product.available_turnarounds,
        mandatoryAddons: product.mandatory_addons,
        availableAddons: product.available_addons,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
      };
    },

    delete: async (options: any) => {
      const result = await query('DELETE FROM products WHERE id = $1 RETURNING *', [
        options.where.id,
      ]);
      if (result.rows.length === 0) return null;

      const product = result.rows[0];
      return {
        ...product,
        basePrice: parseFloat(product.base_price),
        productType: product.product_type,
        imageUrl: product.image_url,
        categoryId: product.category_id,
        quantities: product.quantities,
        sizes: product.sizes,
        availablePaperStocks: product.available_paper_stocks,
        availableTurnarounds: product.available_turnarounds,
        mandatoryAddons: product.mandatory_addons,
        availableAddons: product.available_addons,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
      };
    },
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
        updatedAt: row.updated_at,
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
          data.isActive !== undefined ? data.isActive : true,
        ]
      );

      const category = result.rows[0];
      return {
        ...category,
        isActive: category.is_active,
        parentId: category.parent_id,
        sortOrder: category.sort_order,
        createdAt: category.created_at,
        updatedAt: category.updated_at,
      };
    },
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
            option.sortOrder || 0,
          ]
        );
        results.push(result.rows[0]);
      }

      return { count: results.length };
    },
  },

  // Raw query methods
  $queryRaw: async (strings: TemplateStringsArray, ...values: any[]) => {
    // Build the query from template literal
    let sql = '';
    for (let i = 0; i < strings.length; i++) {
      sql += strings[i];
      if (i < values.length) {
        sql += `$${i + 1}`;
      }
    }
    const result = await query(sql, values);
    return result.rows;
  },

  $queryRawUnsafe: async (sql: string, ...values: any[]) => {
    const result = await query(sql, values);
    return result.rows;
  },

  $executeRaw: async (strings: TemplateStringsArray, ...values: any[]) => {
    let sql = '';
    for (let i = 0; i < strings.length; i++) {
      sql += strings[i];
      if (i < values.length) {
        sql += `$${i + 1}`;
      }
    }
    const result = await query(sql, values);
    return result.rowCount || 0;
  },

  $executeRawUnsafe: async (sql: string, ...values: any[]) => {
    const result = await query(sql, values);
    return result.rowCount || 0;
  },

  // User queries
  user: {
    findMany: async (options?: any) => {
      let sql = 'SELECT * FROM users';
      const conditions = [];
      const params: any[] = [];

      if (options?.where?.role !== undefined) {
        conditions.push(`role = $${params.length + 1}`);
        params.push(options.where.role);
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      const result = await query(sql, params);
      const users = result.rows.map((row: any) => ({
        ...row,
        emailVerified: row.email_verified,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      // Handle includes
      if (options?.include?.orders) {
        for (const user of users) {
          const ordersResult = await query(
            'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
            [user.id]
          );
          user.orders = ordersResult.rows.map((row: any) => ({
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
          }));
        }
      }

      return users;
    },

    findUnique: async (options: any) => {
      const result = await query('SELECT * FROM users WHERE id = $1', [options.where.id]);
      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        ...row,
        emailVerified: row.email_verified,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    },
  },

  // Order queries
  order: {
    create: async (data: any) => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const orderResult = await client.query(
          `INSERT INTO orders (
            order_number, user_id, status, subtotal, tax_amount, total_amount,
            transaction_id, payment_method, payment_status,
            billing_first_name, billing_last_name, billing_email, billing_phone,
            billing_address_1, billing_address_2, billing_city, billing_state, billing_postcode, billing_country,
            shipping_first_name, shipping_last_name, shipping_address_1, shipping_address_2,
            shipping_city, shipping_state, shipping_postcode, shipping_country,
            shipping_carrier, shipping_service, shipping_rate_amount, pickup_airport_id,
            customer_notes, internal_notes,
            created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, NOW(), NOW())
          RETURNING *`,
          [
            data.data.orderNumber,
            data.data.userId,
            data.data.status || 'pending',
            data.data.subtotal,
            data.data.taxAmount || 0,
            data.data.totalAmount,
            data.data.transactionId || null,
            data.data.paymentMethod || 'card',
            data.data.paymentStatus || 'unpaid',
            // Billing info
            data.data.billingInfo?.firstName || data.data.billingInfo?.name?.split(' ')[0] || '',
            data.data.billingInfo?.lastName ||
              data.data.billingInfo?.name?.split(' ').slice(1).join(' ') ||
              '',
            data.data.billingInfo?.email || '',
            data.data.billingInfo?.phone || '',
            data.data.billingInfo?.address || data.data.billingInfo?.street || '',
            data.data.billingInfo?.address2 || '',
            data.data.billingInfo?.city || '',
            data.data.billingInfo?.state || '',
            data.data.billingInfo?.zipCode || data.data.billingInfo?.zip || '',
            data.data.billingInfo?.country || 'US',
            // Shipping info
            data.data.shippingAddress?.firstName ||
              data.data.shippingAddress?.fullName?.split(' ')[0] ||
              '',
            data.data.shippingAddress?.lastName ||
              data.data.shippingAddress?.fullName?.split(' ').slice(1).join(' ') ||
              '',
            data.data.shippingAddress?.address || data.data.shippingAddress?.street || '',
            data.data.shippingAddress?.address2 || '',
            data.data.shippingAddress?.city || '',
            data.data.shippingAddress?.state || '',
            data.data.shippingAddress?.zipCode || data.data.shippingAddress?.zip || '',
            data.data.shippingAddress?.country || 'US',
            // Shipping carrier info
            data.data.shippingCarrier || null,
            data.data.shippingService || null,
            data.data.shippingRateAmount || null,
            data.data.pickupAirportId || null,
            // Notes
            data.data.customerNotes || null,
            data.data.internalNotes || null,
          ]
        );

        const order = orderResult.rows[0];

        // Insert order items
        for (const item of data.data.orderItems.create) {
          await client.query(
            `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price, configuration, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
            [
              order.id,
              item.productId,
              item.productName || 'Product',
              item.quantity,
              item.unitPrice,
              item.totalPrice,
              JSON.stringify(item.options || item.configuration || {}),
            ]
          );
        }

        await client.query('COMMIT');

        return {
          ...order,
          orderNumber: order.order_number,
          userId: order.user_id,
          subtotal: parseFloat(order.subtotal),
          taxAmount: parseFloat(order.tax_amount),
          totalAmount: parseFloat(order.total_amount),
          transactionId: order.transaction_id,
          paymentStatus: order.payment_status,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
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
        updatedAt: row.updated_at,
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
        orderItems: [],
      }));
    },
  },
};

export default prisma;
