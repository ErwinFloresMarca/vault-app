import { randomInt } from 'node:crypto'
import { prisma } from '~/server/utils/db'
import { escapeHtml, sendMail } from '~/server/utils/mailer'
import type { DeliveryMethod, OrderStatus, Prisma } from '@gen-prisma/client'
import type { CreateOrderInput, OrderDto, OrderSplit } from '~/types'
import { isSellable } from '~/utils/itemAvailability'

export const ORDER_STATUSES: OrderStatus[] = ['PENDING_PAYMENT', 'PAID', 'IN_PRODUCTION', 'READY', 'SHIPPED', 'DELIVERED', 'CANCELLED']

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'Pedido realizado (pendiente de pago)',
  PAID: 'Pedido confirmado (pagado)',
  IN_PRODUCTION: 'En impresión',
  READY: 'Listo',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
}

export const DELIVERY_LABEL: Record<DeliveryMethod, string> = {
  PICKUP: 'Entrega en la ciudad / retiro',
  SHIPPING: 'Envío departamental',
}

const MAX_QTY = 50
const MAX_LINES = 30

const orderInclude = {
  items: { orderBy: { name: 'asc' } },
  printedBy: { select: { id: true, name: true } },
} satisfies Prisma.OrderInclude

type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>

const num = (v: Prisma.Decimal | number | null | undefined) => (v == null ? 0 : Number(v))
const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * Reparto del contrato de socios: quien imprime recupera su costo y la
 * utilidad neta (subtotal − costo de impresión − otros gastos) se divide 50/50.
 * El envío lo paga el cliente y no se reparte.
 */
export function computeSplit(subtotal: number, printCost: number, otherCosts: number): OrderSplit {
  const netProfit = round2(subtotal - printCost - otherCosts)
  const partnerShare = round2(netProfit / 2)
  return { netProfit, partnerShare, printerTotal: round2(printCost + partnerShare) }
}

function toDto(o: OrderRow): OrderDto {
  const subtotal = num(o.subtotal)
  const shippingCost = num(o.shippingCost)
  const printCost = num(o.printCost)
  const otherCosts = num(o.otherCosts)
  const items = o.items.map((i) => ({
    id: i.id,
    itemId: i.itemId,
    name: i.name,
    collectionName: i.collectionName,
    imageUrl: i.imageUrl,
    unitPrice: num(i.unitPrice),
    quantity: i.quantity,
    lineTotal: round2(num(i.unitPrice) * i.quantity),
  }))
  return {
    id: o.id,
    number: o.number,
    code: o.code,
    status: o.status,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    customerEmail: o.customerEmail,
    customerCity: o.customerCity,
    deliveryMethod: o.deliveryMethod,
    address: o.address,
    notes: o.notes,
    subtotal,
    shippingCost,
    total: round2(subtotal + shippingCost),
    printCost,
    otherCosts,
    printedBy: o.printedBy ? { id: o.printedBy.id, name: o.printedBy.name } : null,
    adminNotes: o.adminNotes,
    confirmedAt: o.confirmedAt ? o.confirmedAt.toISOString() : null,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    items,
    itemCount: items.reduce((acc, i) => acc + i.quantity, 0),
    split: computeSplit(subtotal, printCost, otherCosts),
  }
}

export const formatOrderNumber = (n: number) => `#${String(n).padStart(4, '0')}`
const bs = (n: number) => `Bs ${n.toFixed(2)}`

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function fail(message: string): never {
  throw createError({ statusCode: 422, statusMessage: message })
}

// Código único que ve el cliente: VV-XXXX-XXXX (sin caracteres ambiguos como 0/O, 1/I).
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function generateOrderCode(): string {
  const pick = () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]
  const block = () => Array.from({ length: 4 }, pick).join('')
  return `VV-${block()}-${block()}`
}

function siteUrl(): string {
  return String(useRuntimeConfig().public.siteUrl || '').replace(/\/$/, '')
}

function whatsappDigits(phone: string | null): string {
  let digits = (phone ?? '').replace(/\D/g, '')
  if (digits.length === 8) digits = `591${digits}` // número boliviano sin código de país
  return digits
}

/** Tabla de productos reutilizada en los correos. */
function itemsTableHtml(order: OrderDto): string {
  const rows = order.items.map((i) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;white-space:nowrap">${i.quantity} ×</td>
      <td style="padding:8px;border-bottom:1px solid #eee"><strong>${escapeHtml(i.name)}</strong>${i.collectionName ? `<br><span style="color:#777;font-size:12px">${escapeHtml(i.collectionName)}</span>` : ''}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${bs(i.lineTotal)}</td>
    </tr>`).join('')
  const shipping = order.shippingCost > 0
    ? `<tr><td></td><td style="padding:8px;text-align:right">Envío</td><td style="padding:8px;text-align:right">${bs(order.shippingCost)}</td></tr>
       <tr><td></td><td style="padding:8px;text-align:right"><strong>Total</strong></td><td style="padding:8px;text-align:right"><strong>${bs(order.total)}</strong></td></tr>`
    : ''
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
      <tr><td></td><td style="padding:8px;text-align:right"><strong>Subtotal</strong></td><td style="padding:8px;text-align:right"><strong>${bs(order.subtotal)}</strong></td></tr>
      ${shipping}
    </table>`
}

/** Marco común de los correos (cabecera oscura con el verde de marca). */
function emailLayout(title: string, eyebrow: string, body: string): string {
  const appConfig = useAppConfig() as { volt?: { social?: { label: string; url: string }[] } }
  const social = (appConfig.volt?.social ?? []).map((s) => `<a href="${s.url}" style="color:#777;margin:0 6px">${escapeHtml(s.label)}</a>`).join('·')
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#111">
    <div style="background:#171717;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
      <div style="font-size:13px;color:#b0ef1f;font-weight:bold">${escapeHtml(eyebrow)}</div>
      <div style="font-size:22px;font-weight:bold;margin-top:4px">${escapeHtml(title)}</div>
    </div>
    <div style="border:1px solid #e5e5e5;border-top:0;padding:20px 24px;border-radius:0 0 12px 12px">
      ${body}
    </div>
    <p style="text-align:center;color:#999;font-size:12px;margin:16px 0">Volt 3D · Volt Vault ${social ? `<br>${social}` : ''}</p>
  </div>`
}

function codeBox(code: string): string {
  return `<div style="background:#f7fee7;border:1px solid #d9f99d;border-radius:10px;padding:12px 16px;margin:16px 0;text-align:center">
    <div style="font-size:12px;color:#4d7c0f">Código de tu pedido</div>
    <div style="font-size:24px;font-weight:bold;letter-spacing:2px;font-family:'Courier New',monospace">${escapeHtml(code)}</div>
    <div style="font-size:12px;color:#666">Indícalo al pagar o al consultarnos por tu pedido.</div>
  </div>`
}

/** Fase 1 — al cliente: "Pedido realizado" con su código e instrucciones de pago por QR. */
async function sendOrderPlacedToCustomer(order: OrderDto) {
  const config = useRuntimeConfig()
  const appConfig = useAppConfig() as { volt?: { whatsapp?: string } }
  const qrUrl = String(config.paymentQrUrl || '')
  const qrSrc = qrUrl ? (qrUrl.startsWith('http') ? qrUrl : `${siteUrl()}${qrUrl.startsWith('/') ? '' : '/'}${qrUrl}`) : ''
  const shopWa = whatsappDigits(appConfig.volt?.whatsapp ?? '')
  const waText = encodeURIComponent(`Hola, envío el comprobante de pago del pedido ${order.code}.`)

  const payment = qrSrc
    ? `<p style="margin:16px 0 8px"><strong>Para confirmar tu pedido, paga escaneando este QR</strong> por <strong>${bs(order.subtotal)}</strong>${order.deliveryMethod === 'SHIPPING' ? ' (el costo de envío te lo confirmamos aparte)' : ''}:</p>
       <p style="text-align:center"><img src="${qrSrc}" alt="QR de pago" width="220" style="max-width:220px;border-radius:8px;border:1px solid #eee"></p>
       <p style="font-size:13px;color:#555">Luego responde este correo con el comprobante${shopWa ? ` o envíalo por <a href="https://wa.me/${shopWa}?text=${waText}">WhatsApp</a>` : ''}, indicando tu código.</p>`
    : `<p style="margin:16px 0 8px"><strong>Siguiente paso:</strong> te enviaremos el <strong>QR de pago</strong> por este correo${order.customerPhone ? ' (y por WhatsApp)' : ''} para confirmar tu pedido.</p>`

  const body = `
    <p style="margin:0 0 8px">Hola <strong>${escapeHtml(order.customerName)}</strong>, recibimos tu pedido. ¡Gracias por tu compra!</p>
    ${codeBox(order.code)}
    ${itemsTableHtml(order)}
    <p style="margin:12px 0 0;font-size:14px"><strong>Entrega:</strong> ${DELIVERY_LABEL[order.deliveryMethod]}${order.address ? ` — ${escapeHtml(order.address)}` : ''}</p>
    ${payment}
    <ol style="font-size:13px;color:#555;padding-left:18px;margin:16px 0 0">
      <li><strong>Pedido realizado</strong> — este correo.</li>
      <li><strong>Pedido confirmado</strong> — te avisamos en cuanto verifiquemos tu pago y comenzamos la producción.</li>
    </ol>`

  const text = [
    `Hola ${order.customerName}, recibimos tu pedido.`,
    `Código de tu pedido: ${order.code}`,
    '',
    ...order.items.map((i) => `• ${i.quantity} × ${i.name} — ${bs(i.lineTotal)}`),
    `Subtotal: ${bs(order.subtotal)}`,
    `Entrega: ${DELIVERY_LABEL[order.deliveryMethod]}${order.address ? ` — ${order.address}` : ''}`,
    '',
    qrSrc ? `Para confirmar tu pedido paga por QR: ${qrSrc}` : 'Te enviaremos el QR de pago para confirmar tu pedido.',
    'Cuando verifiquemos el pago recibirás el correo "Pedido confirmado".',
  ].join('\n')

  await sendMail({
    to: order.customerEmail,
    subject: `Pedido realizado ${order.code} — Volt Vault`,
    html: emailLayout('Pedido realizado', 'Volt Vault', body),
    text,
  })
}

/** Fase 2 — al cliente: "Pedido confirmado" cuando se verifica el pago por QR. */
async function sendOrderConfirmedToCustomer(order: OrderDto) {
  const body = `
    <p style="margin:0 0 8px">Hola <strong>${escapeHtml(order.customerName)}</strong>, verificamos tu pago. <strong>¡Tu pedido está confirmado!</strong></p>
    ${codeBox(order.code)}
    ${itemsTableHtml(order)}
    <p style="margin:12px 0 0;font-size:14px"><strong>Entrega:</strong> ${DELIVERY_LABEL[order.deliveryMethod]}${order.address ? ` — ${escapeHtml(order.address)}` : ''}</p>
    <p style="margin:16px 0 0;font-size:14px">Ya comenzamos a preparar tu pedido. El tiempo de producción depende del producto y la cantidad; te escribiremos cuando esté listo${order.deliveryMethod === 'SHIPPING' ? ' y te enviaremos fotos del empaque y el comprobante de envío' : ''}.</p>`

  const text = [
    `Hola ${order.customerName}, verificamos tu pago. ¡Tu pedido está confirmado!`,
    `Código de tu pedido: ${order.code}`,
    '',
    ...order.items.map((i) => `• ${i.quantity} × ${i.name} — ${bs(i.lineTotal)}`),
    `Total: ${bs(order.total)}`,
    '',
    'Ya comenzamos a preparar tu pedido. Te avisaremos cuando esté listo.',
  ].join('\n')

  return sendMail({
    to: order.customerEmail,
    subject: `Pedido confirmado ${order.code} — Volt Vault`,
    html: emailLayout('Pedido confirmado', 'Volt Vault', body),
    text,
  })
}

/** Aviso interno al responsable: quién pidió y qué pidió. */
async function notifyNewOrder(order: OrderDto) {
  const config = useRuntimeConfig()
  const recipients = String(config.orderNotifyEmail || '').split(',').map((s) => s.trim()).filter(Boolean)
  if (!recipients.length) {
    console.warn('[orders] NUXT_ORDER_NOTIFY_EMAIL vacío: no se envía aviso del pedido', order.code)
    return
  }
  const link = `${siteUrl()}/admin/orders?id=${order.id}`
  const wa = whatsappDigits(order.customerPhone)

  const body = `
    <p style="margin:0 0 4px"><strong>${escapeHtml(order.customerName)}</strong></p>
    <p style="margin:0 0 4px">Correo: <a href="mailto:${escapeHtml(order.customerEmail)}">${escapeHtml(order.customerEmail)}</a></p>
    ${order.customerPhone ? `<p style="margin:0 0 4px">WhatsApp: <a href="https://wa.me/${wa}">${escapeHtml(order.customerPhone)}</a></p>` : ''}
    <p style="margin:0 0 4px">Ciudad: ${escapeHtml(order.customerCity)}</p>
    <p style="margin:0 0 4px">Entrega: ${DELIVERY_LABEL[order.deliveryMethod]}${order.address ? ` — ${escapeHtml(order.address)}` : ''}</p>
    <p style="margin:0 0 16px;color:#777;font-size:12px">Código del cliente: <strong>${escapeHtml(order.code)}</strong> · interno ${formatOrderNumber(order.number)}</p>
    ${itemsTableHtml(order)}
    ${order.deliveryMethod === 'SHIPPING' ? '<p style="color:#777;font-size:12px;margin:4px 0 0">+ costo de envío departamental (a coordinar)</p>' : ''}
    ${order.notes ? `<p style="background:#f5f5f5;padding:10px 12px;border-radius:8px;font-size:13px"><strong>Notas:</strong> ${escapeHtml(order.notes)}</p>` : ''}
    <p style="margin:20px 0 0"><a href="${link}" style="background:#b0ef1f;color:#111;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:bold">Ver pedido en el panel</a></p>
    <p style="margin:12px 0 0;font-size:12px;color:#777">Al verificar el pago, cambia el estado a "Pedido confirmado" y el cliente recibirá su correo de confirmación.</p>`

  const text = [
    `Nuevo pedido ${order.code} en Volt Vault`,
    '',
    `Cliente: ${order.customerName}`,
    `Correo: ${order.customerEmail}`,
    order.customerPhone ? `WhatsApp: ${order.customerPhone}` : '',
    `Ciudad: ${order.customerCity}`,
    `Entrega: ${DELIVERY_LABEL[order.deliveryMethod]}${order.address ? ` — ${order.address}` : ''}`,
    '',
    'Pidió:',
    ...order.items.map((i) => `  • ${i.quantity} × ${i.name}${i.collectionName ? ` (${i.collectionName})` : ''} — ${bs(i.lineTotal)}`),
    '',
    `Subtotal: ${bs(order.subtotal)}${order.deliveryMethod === 'SHIPPING' ? ' + costo de envío' : ''}`,
    order.notes ? `Notas: ${order.notes}` : '',
    '',
    `Ver en el panel: ${link}`,
  ].filter((l) => l !== '').join('\n')

  await sendMail({
    to: recipients,
    subject: `Nuevo pedido ${order.code} — ${order.customerName} (${bs(order.subtotal)})`,
    text,
    html: emailLayout(`Nuevo pedido ${order.code}`, 'Volt Vault · Aviso interno', body),
    replyTo: order.customerEmail,
  })
}

export const orderService = {
  /**
   * Crea un pedido desde el carrito. Los precios se toman de la BD (nunca del
   * cliente). Envía el correo de aviso en segundo plano.
   */
  async create(input: CreateOrderInput, userId: string | null): Promise<OrderDto> {
    const customerName = clean(input.customerName, 120)
    const customerPhone = clean(input.customerPhone, 30) || null
    const customerEmail = clean(input.customerEmail, 160).toLowerCase()
    const customerCity = clean(input.customerCity, 80)
    const deliveryMethod: DeliveryMethod = input.deliveryMethod === 'SHIPPING' ? 'SHIPPING' : 'PICKUP'
    const address = clean(input.address, 300) || null
    const notes = clean(input.notes, 1000) || null

    if (customerName.length < 2) fail('Ingresa tu nombre')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) fail('Ingresa un correo válido: ahí te enviaremos la confirmación de tu pedido')
    if (customerPhone && customerPhone.replace(/\D/g, '').length < 7) fail('El número de WhatsApp no es válido')
    if (!customerCity) fail('Ingresa tu ciudad')
    if (deliveryMethod === 'SHIPPING' && !address) fail('Para envío departamental indica la dirección o agencia de destino')

    if (!Array.isArray(input.items) || input.items.length === 0) fail('El carrito está vacío')
    if (input.items.length > MAX_LINES) fail('Demasiados productos en un solo pedido')

    // Agrupa líneas repetidas y valida cantidades
    const qtyById = new Map<string, number>()
    for (const line of input.items) {
      const qty = Number(line?.quantity)
      if (typeof line?.itemId !== 'string' || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
        fail(`Cantidad inválida (de 1 a ${MAX_QTY} por producto)`)
      }
      qtyById.set(line.itemId, Math.min(MAX_QTY, (qtyById.get(line.itemId) ?? 0) + qty))
    }

    const items = await prisma.collectionItem.findMany({
      where: { id: { in: [...qtyById.keys()] } },
      include: {
        collection: { select: { name: true, status: true } },
        files: { include: { file: true }, orderBy: { position: 'asc' }, take: 1 },
      },
    })
    if (items.length !== qtyById.size) fail('Uno de los productos ya no está disponible. Revisa tu carrito.')
    for (const it of items) {
      if (it.collection.status !== 'PUBLISHED' || it.status === 'DRAFT' || it.status === 'ARCHIVED') {
        fail(`"${it.name}" ya no está disponible. Quítalo del carrito.`)
      }
      if (!isSellable(it.status, it.stock)) {
        fail(`"${it.name}" está agotado. Quítalo del carrito.`)
      }
      if (it.price == null) fail(`"${it.name}" no tiene precio definido; consúltalo por WhatsApp.`)
    }

    const lines = items.map((it) => ({
      itemId: it.id,
      name: it.name,
      collectionName: it.collection.name,
      imageUrl: it.files[0]?.file.url ?? null,
      unitPrice: Number(it.price),
      quantity: qtyById.get(it.id)!,
    }))
    const subtotal = round2(lines.reduce((acc, l) => acc + l.unitPrice * l.quantity, 0))

    // Crea el pedido con un código único (reintenta si hubiera colisión)
    let created: OrderRow | null = null
    for (let attempt = 0; attempt < 5 && !created; attempt++) {
      try {
        created = await prisma.order.create({
          data: {
            code: generateOrderCode(),
            userId,
        customerName,
        customerPhone,
        customerEmail,
        customerCity,
        deliveryMethod,
        address,
        notes,
            subtotal,
            items: { create: lines },
          },
          include: orderInclude,
        })
      } catch (err) {
        const isCodeClash = (err as { code?: string; meta?: { target?: unknown } }).code === 'P2002'
        if (!isCodeClash || attempt === 4) throw err
      }
    }

    const dto = toDto(created!)
    // Correos sin bloquear la respuesta: "Pedido realizado" al cliente + aviso interno
    sendOrderPlacedToCustomer(dto).catch((err) => console.error('[orders] correo al cliente fallido', err))
    notifyNewOrder(dto).catch((err) => console.error('[orders] aviso interno fallido', err))
    return dto
  },

  async list(query: { status?: string; from?: string; to?: string; q?: string; page?: number; pageSize?: number; all?: boolean }) {
    const where: Prisma.OrderWhereInput = {}
    if (query.status && (ORDER_STATUSES as string[]).includes(query.status)) {
      where.status = query.status as OrderStatus
    }
    const createdAt: Prisma.DateTimeFilter = {}
    if (query.from) {
      const d = new Date(`${query.from}T00:00:00`)
      if (!Number.isNaN(d.getTime())) createdAt.gte = d
    }
    if (query.to) {
      const d = new Date(`${query.to}T23:59:59.999`)
      if (!Number.isNaN(d.getTime())) createdAt.lte = d
    }
    if (createdAt.gte || createdAt.lte) where.createdAt = createdAt
    if (query.q?.trim()) {
      const q = query.q.trim()
      const asNumber = Number(q.replace('#', ''))
      where.OR = [
        { customerName: { contains: q, mode: 'insensitive' } },
        { code: { contains: q.toUpperCase() } },
        { customerEmail: { contains: q, mode: 'insensitive' } },
        { customerPhone: { contains: q } },
        { customerCity: { contains: q, mode: 'insensitive' } },
        { items: { some: { name: { contains: q, mode: 'insensitive' } } } },
        ...(Number.isInteger(asNumber) && asNumber > 0 ? [{ number: asNumber }] : []),
      ]
    }

    const page = Math.max(1, Math.floor(query.page ?? 1))
    const pageSize = Math.min(100, Math.max(1, Math.floor(query.pageSize ?? 20)))

    const [total, rows, all] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
        ...(query.all ? {} : { skip: (page - 1) * pageSize, take: pageSize }),
      }),
      // Totales del filtro (sin cancelados), para el resumen del panel
      prisma.order.findMany({
        where: { AND: [where, { status: { not: 'CANCELLED' } }] },
        select: { subtotal: true, shippingCost: true, printCost: true, otherCosts: true, printedByUserId: true },
      }),
    ])

    const summary = all.reduce((acc, o) => {
      const s = computeSplit(num(o.subtotal), num(o.printCost), num(o.otherCosts))
      acc.orders += 1
      acc.sales = round2(acc.sales + num(o.subtotal))
      acc.printCost = round2(acc.printCost + num(o.printCost))
      acc.netProfit = round2(acc.netProfit + s.netProfit)
      return acc
    }, { orders: 0, sales: 0, printCost: 0, netProfit: 0 })

    return {
      data: rows.map(toDto),
      total,
      page,
      pageSize,
      summary: { ...summary, partnerShare: round2(summary.netProfit / 2) },
    }
  },

  async get(id: string): Promise<OrderDto> {
    const o = await prisma.order.findUnique({ where: { id }, include: orderInclude })
    if (!o) throw createError({ statusCode: 404, statusMessage: 'Pedido no encontrado' })
    return toDto(o)
  },

  async update(id: string, input: {
    status?: string
    shippingCost?: number | string
    printCost?: number | string
    otherCosts?: number | string
    printedByUserId?: string | null
    adminNotes?: string | null
  }): Promise<OrderDto & { confirmationSent: boolean }> {
    const existing = await prisma.order.findUnique({ where: { id } })
    if (!existing) throw createError({ statusCode: 404, statusMessage: 'Pedido no encontrado' })

    const money = (v: number | string, label: string) => {
      const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'))
      if (!Number.isFinite(n) || n < 0) fail(`${label}: debe ser un número mayor o igual a 0`)
      return round2(n)
    }

    const data: Prisma.OrderUpdateInput = {}
    if (input.status !== undefined) {
      if (!(ORDER_STATUSES as string[]).includes(input.status)) fail('Estado inválido')
      data.status = input.status as OrderStatus
    }
    if (input.shippingCost !== undefined && input.shippingCost !== '') data.shippingCost = money(input.shippingCost, 'Costo de envío')
    if (input.printCost !== undefined && input.printCost !== '') data.printCost = money(input.printCost, 'Costo de impresión')
    if (input.otherCosts !== undefined && input.otherCosts !== '') data.otherCosts = money(input.otherCosts, 'Otros gastos')
    if (input.adminNotes !== undefined) data.adminNotes = clean(input.adminNotes, 2000) || null
    if (input.printedByUserId !== undefined) {
      if (input.printedByUserId) {
        const printer = await prisma.user.findUnique({ where: { id: input.printedByUserId } })
        if (!printer || printer.role !== 'ADMIN') fail('Quien imprime debe ser un administrador')
        data.printedBy = { connect: { id: input.printedByUserId } }
      } else {
        data.printedBy = { disconnect: true }
      }
    }

    // Fase 2: al pasar de "Pedido realizado" a pagado (o posterior) por primera vez,
    // se marca confirmedAt y se envía "Pedido confirmado" al cliente.
    const confirming = !existing.confirmedAt
      && data.status !== undefined
      && data.status !== 'PENDING_PAYMENT'
      && data.status !== 'CANCELLED'
    if (confirming) data.confirmedAt = new Date()

    const updated = await prisma.order.update({ where: { id }, data, include: orderInclude })
    const dto = toDto(updated)
    let confirmationSent = false
    if (confirming) confirmationSent = await sendOrderConfirmedToCustomer(dto)
    return { ...dto, confirmationSent }
  },

  /** Reenvía el correo que corresponde a la fase actual del pedido. */
  async resendCustomerEmail(id: string): Promise<boolean> {
    const dto = await this.get(id)
    if (dto.confirmedAt) return sendOrderConfirmedToCustomer(dto)
    await sendOrderPlacedToCustomer(dto)
    return true
  },

  /** Administradores (socios) para el selector "Imprimió". */
  async listAdmins() {
    return prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true, name: true, email: true }, orderBy: { name: 'asc' } })
  },
}
