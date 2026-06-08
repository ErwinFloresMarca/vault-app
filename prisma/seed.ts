import { PrismaClient } from './../generated/prisma/client'
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({
  adapter: pool,
})

async function main() {
  console.log('🌱 Seeding database...')

  // Crear configuración del sistema
  const config = await prisma.systemConfig.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      baseProfitMargin: 100,
      minimumDownPayment: 30,
      gracePeriodDays: 5,
      latePaymentSurcharge: 5,
      autoCancelDays: 15,
      defaultPaymentPlan: 'THREE_INSTALLMENTS',
      companyName: 'Volt3D',
      companyEmail: 'info@volt3d.com',
      companyPhone: '+591 XXXXXXXX',
      companyAddress: 'La Paz, Bolivia',
      socialInstagram: '@volt3d',
      socialFacebook: 'Volt3D',
      socialWhatsapp: '+591 XXXXXXXX',
    },
  })
  console.log('✓ System config created:', config)

  // Crear tipo de cambio inicial
  const exchangeRate = await prisma.exchangeRate.create({
    data: {
      rate: 6.85, // 1 USD = 6.85 BOB (aproximado)
      source: 'manual',
    },
  })
  console.log('✓ Exchange rate created:', exchangeRate)

  // Crear filamentos de ejemplo
  const pla = await prisma.filament.create({
    data: {
      type: 'PLA',
      brand: 'Prusament',
      color: 'Black',
      diameter: 1.75,
      density: 1.23,
      currentPrice: 15.0, // USD per kg
      stock: 5000, // grams
      supplier: 'Local distributor',
    },
  })
  console.log('✓ Filament (PLA) created:', pla)

  const petg = await prisma.filament.create({
    data: {
      type: 'PETG',
      brand: 'Prusament',
      color: 'Orange',
      diameter: 1.75,
      density: 1.27,
      currentPrice: 18.0, // USD per kg
      stock: 3000,
      supplier: 'Local distributor',
    },
  })
  console.log('✓ Filament (PETG) created:', petg)

  // Crear impresoras de ejemplo
  const printerFDM = await prisma.printer.create({
    data: {
      name: 'Prusa i3 MK3S+',
      model: 'MK3S+',
      technology: 'FDM',
      costPerHour: 3.5, // USD per hour
      electricalUsage: 0.5, // kWh
      maxVolume: '250x210x210mm',
      isActive: true,
    },
  })
  console.log('✓ Printer (FDM) created:', printerFDM)

  const printerSLA = await prisma.printer.create({
    data: {
      name: 'Formlabs Form 3',
      model: 'Form 3',
      technology: 'SLA',
      costPerHour: 8.0, // USD per hour
      electricalUsage: 0.3,
      maxVolume: '145x81.5x100mm',
      isActive: true,
    },
  })
  console.log('✓ Printer (SLA) created:', printerSLA)

  console.log('✨ Seeding complete!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
