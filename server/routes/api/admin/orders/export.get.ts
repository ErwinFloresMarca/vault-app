import ExcelJS from 'exceljs'
import { DELIVERY_LABEL, ORDER_STATUS_LABEL, formatOrderNumber, orderService } from '~/server/services/orderService'
import { requireAdmin } from '~/server/utils/auth'
import { orderItemLabel } from '~/utils/orderItemLabel'

/**
 * Exporta los pedidos (con los mismos filtros del panel) a Excel:
 * hoja "Pedidos" (una fila por pedido, con el reparto 50/50) y hoja "Detalle"
 * (una fila por producto).
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const q = getQuery(event)
  const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined)
  const { data: orders } = await orderService.list({
    status: str(q.status),
    from: str(q.from),
    to: str(q.to),
    q: str(q.q),
    all: true,
  })

  // Excel no guarda zona horaria: se escriben las fechas en hora de Bolivia (UTC−4, sin horario de verano).
  const BOLIVIA_OFFSET_MS = 4 * 60 * 60 * 1000
  const localDate = (iso: string) => new Date(new Date(iso).getTime() - BOLIVIA_OFFSET_MS)

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Volt Vault'
  wb.created = new Date()
  const money = '#,##0.00 "Bs"'
  const headerStyle = (ws: ExcelJS.Worksheet) => {
    const row = ws.getRow(1)
    row.font = { bold: true, color: { argb: 'FF111111' } }
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB0EF1F' } }
    row.alignment = { vertical: 'middle' }
    row.height = 22
    ws.views = [{ state: 'frozen', ySplit: 1 }]
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } }
  }

  const ws = wb.addWorksheet('Pedidos')
  ws.columns = [
    { header: 'Código', key: 'code', width: 16 },
    { header: 'N.° interno', key: 'number', width: 11 },
    { header: 'Fecha', key: 'date', width: 18, style: { numFmt: 'dd/mm/yyyy hh:mm' } },
    { header: 'Estado', key: 'status', width: 18 },
    { header: 'Cliente', key: 'customer', width: 24 },
    { header: 'Correo', key: 'email', width: 26 },
    { header: 'WhatsApp', key: 'phone', width: 15 },
    { header: 'Ciudad', key: 'city', width: 14 },
    { header: 'Confirmado', key: 'confirmed', width: 18, style: { numFmt: 'dd/mm/yyyy hh:mm' } },
    { header: 'Entrega', key: 'delivery', width: 26 },
    { header: 'Dirección', key: 'address', width: 28 },
    { header: 'Productos', key: 'products', width: 45 },
    { header: 'Unidades', key: 'units', width: 10 },
    { header: 'Subtotal', key: 'subtotal', width: 13, style: { numFmt: money } },
    { header: 'Envío', key: 'shipping', width: 12, style: { numFmt: money } },
    { header: 'Total cliente', key: 'total', width: 14, style: { numFmt: money } },
    { header: 'Imprimió', key: 'printer', width: 18 },
    { header: 'Costo impresión', key: 'printCost', width: 15, style: { numFmt: money } },
    { header: 'Otros gastos', key: 'otherCosts', width: 13, style: { numFmt: money } },
    { header: 'Utilidad neta', key: 'net', width: 14, style: { numFmt: money } },
    { header: '50 % por socio', key: 'share', width: 14, style: { numFmt: money } },
    { header: 'Recibe quien imprimió', key: 'printerTotal', width: 20, style: { numFmt: money } },
    { header: 'Notas del cliente', key: 'notes', width: 30 },
    { header: 'Notas internas', key: 'adminNotes', width: 30 },
  ]
  for (const o of orders) {
    ws.addRow({
      code: o.code,
      number: formatOrderNumber(o.number),
      date: localDate(o.createdAt),
      status: ORDER_STATUS_LABEL[o.status],
      customer: o.customerName,
      phone: o.customerPhone ?? '',
      email: o.customerEmail,
      city: o.customerCity,
      confirmed: o.confirmedAt ? localDate(o.confirmedAt) : null,
      delivery: DELIVERY_LABEL[o.deliveryMethod],
      address: o.address ?? '',
      products: o.items.map((i) => `${i.quantity} × ${orderItemLabel(i)}`).join(', '),
      units: o.itemCount,
      subtotal: o.subtotal,
      shipping: o.shippingCost,
      total: o.total,
      printer: o.printedBy?.name ?? '',
      printCost: o.printCost,
      otherCosts: o.otherCosts,
      net: o.split.netProfit,
      share: o.split.partnerShare,
      printerTotal: o.printedBy ? o.split.printerTotal : null,
      notes: o.notes ?? '',
      adminNotes: o.adminNotes ?? '',
    })
  }
  headerStyle(ws)

  // Fila de totales (sin pedidos cancelados)
  const valid = orders.filter((o) => o.status !== 'CANCELLED')
  const sum = (f: (o: typeof orders[number]) => number) => Math.round(valid.reduce((a, o) => a + f(o), 0) * 100) / 100
  const totalRow = ws.addRow({
    code: 'TOTAL',
    products: `${valid.length} pedidos (sin cancelados)`,
    units: valid.reduce((a, o) => a + o.itemCount, 0),
    subtotal: sum((o) => o.subtotal),
    shipping: sum((o) => o.shippingCost),
    total: sum((o) => o.total),
    printCost: sum((o) => o.printCost),
    otherCosts: sum((o) => o.otherCosts),
    net: sum((o) => o.split.netProfit),
    share: sum((o) => o.split.partnerShare),
  })
  totalRow.font = { bold: true }
  totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }

  const detail = wb.addWorksheet('Detalle')
  detail.columns = [
    { header: 'Código', key: 'number', width: 16 },
    { header: 'Fecha', key: 'date', width: 18, style: { numFmt: 'dd/mm/yyyy hh:mm' } },
    { header: 'Estado', key: 'status', width: 18 },
    { header: 'Cliente', key: 'customer', width: 24 },
    { header: 'Producto', key: 'product', width: 30 },
    { header: 'Color', key: 'color', width: 16 },
    { header: 'Colección', key: 'collection', width: 24 },
    { header: 'Cantidad', key: 'qty', width: 10 },
    { header: 'Precio unitario', key: 'unit', width: 15, style: { numFmt: money } },
    { header: 'Total línea', key: 'line', width: 14, style: { numFmt: money } },
  ]
  for (const o of orders) {
    for (const i of o.items) {
      detail.addRow({
        number: o.code,
        date: localDate(o.createdAt),
        status: ORDER_STATUS_LABEL[o.status],
        customer: o.customerName,
        product: i.name,
        color: i.colorName ?? '',
        collection: i.collectionName ?? '',
        qty: i.quantity,
        unit: i.unitPrice,
        line: i.lineTotal,
      })
    }
  }
  headerStyle(detail)

  const buffer = await wb.xlsx.writeBuffer()
  const stamp = new Date().toISOString().slice(0, 10)
  setResponseHeaders(event, {
    'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'content-disposition': `attachment; filename="pedidos-volt-vault-${stamp}.xlsx"`,
    'cache-control': 'no-store',
  })
  return Buffer.from(buffer as ArrayBuffer)
})
