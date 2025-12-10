import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import PDFDocument from 'pdfkit';
import { formatDate } from 'date-fns';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch order with details
    const order = await prisma.order.findUnique({
      where: { id: id },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check authorization (user can only access their own orders, admins can access all)
    if (session.user.role !== 'admin' && order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Create PDF
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    // Company Header
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('UV COATED CLUB FLYERS', { align: 'center' })
      .fontSize(10)
      .font('Helvetica')
      .text('251 Little Falls Dr, Wilmington, DE 19808', { align: 'center' })
      .text('Phone: (555) 123-4567 | Email: orders@uvcoatedflyers.com', { align: 'center' })
      .moveDown(2);

    // Invoice Title
    doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', { align: 'center' }).moveDown(1);

    // Order Information
    const startY = doc.y;
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Order Number:', 50, startY)
      .font('Helvetica')
      .text(order.orderNumber, 150, startY);

    doc
      .font('Helvetica-Bold')
      .text('Order Date:', 50, startY + 15)
      .font('Helvetica')
      .text(formatDate(order.createdAt, 'MMMM d, yyyy'), 150, startY + 15);

    doc
      .font('Helvetica-Bold')
      .text('Payment Status:', 50, startY + 30)
      .font('Helvetica')
      .text(order.paymentStatus || 'PENDING', 150, startY + 30);

    // Customer Information
    doc
      .font('Helvetica-Bold')
      .text('Bill To:', 350, startY)
      .font('Helvetica')
      .text(order.user?.name || 'Customer', 350, startY + 15)
      .text(order.user?.email || '', 350, startY + 30);

    doc.moveDown(3);

    // Shipping Address
    if (order.shippingAddress && typeof order.shippingAddress === 'object') {
      const addr = order.shippingAddress as any;
      doc
        .font('Helvetica-Bold')
        .text('Ship To:', 50)
        .font('Helvetica')
        .text(addr.fullName || addr.name || '', 50)
        .text(addr.address || addr.street || '', 50)
        .text(`${addr.city || ''}, ${addr.state || ''} ${addr.zipCode || addr.zip || ''}`, 50);

      doc.moveDown(2);
    }

    // Items Table Header
    const tableTop = doc.y;
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Item', 50, tableTop)
      .text('Qty', 300, tableTop, { width: 50, align: 'right' })
      .text('Unit Price', 360, tableTop, { width: 80, align: 'right' })
      .text('Total', 450, tableTop, { width: 100, align: 'right' });

    // Draw line under header
    doc
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    // Items
    let itemY = tableTop + 25;
    order.orderItems.forEach((item: { product: { name: string }; quantity: number; unitPrice: number; totalPrice: number; options?: Record<string, unknown> }) => {
      if (itemY > 700) {
        doc.addPage();
        itemY = 50;
      }

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(item.product?.name || 'Product', 50, itemY, { width: 240 })
        .text(item.quantity.toLocaleString(), 300, itemY, { width: 50, align: 'right' })
        .text(`$${(item.unitPrice / 100).toFixed(2)}`, 360, itemY, { width: 80, align: 'right' })
        .text(`$${(item.totalPrice / 100).toFixed(2)}`, 450, itemY, { width: 100, align: 'right' });

      // Show configuration
      if (item.options && typeof item.options === 'object') {
        itemY += 15;
        const config = Object.entries(item.options as Record<string, any>)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        doc
          .fontSize(8)
          .fillColor('#666666')
          .text(config, 50, itemY, { width: 240 })
          .fillColor('#000000');
      }

      itemY += 30;
    });

    // Totals
    const totalsY = itemY + 20;
    doc
      .fontSize(10)
      .font('Helvetica')
      .text('Subtotal:', 400, totalsY)
      .text(`$${(order.subtotal / 100).toFixed(2)}`, 450, totalsY, { width: 100, align: 'right' });

    if (order.shippingRateAmount) {
      doc
        .text('Shipping:', 400, totalsY + 15)
        .text(`$${(order.shippingRateAmount / 100).toFixed(2)}`, 450, totalsY + 15, {
          width: 100,
          align: 'right',
        });
    }

    if (order.taxAmount) {
      doc
        .text('Tax:', 400, totalsY + 30)
        .text(`$${(order.taxAmount / 100).toFixed(2)}`, 450, totalsY + 30, {
          width: 100,
          align: 'right',
        });
    }

    // Draw line before total
    doc
      .moveTo(400, totalsY + 45)
      .lineTo(550, totalsY + 45)
      .stroke();

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Total:', 400, totalsY + 50)
      .text(`$${(order.totalAmount / 100).toFixed(2)}`, 450, totalsY + 50, {
        width: 100,
        align: 'right',
      });

    // Footer
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#666666')
      .text('Thank you for your business!', 50, 750, { align: 'center', width: 500 })
      .text(
        'For questions about this invoice, please contact support@uvcoatedflyers.com',
        50,
        765,
        { align: 'center', width: 500 }
      );

    doc.end();

    // Wait for PDF to be generated
    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });

    // Return PDF
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice-${order.orderNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Receipt generation error:', error);
    return NextResponse.json({ error: 'Failed to generate receipt' }, { status: 500 });
  }
}
