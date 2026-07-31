import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { subDays, startOfDay } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Users
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: 'Admin Novarea',
      role: 'ADMINISTRATEUR',
      email: 'admin@novarea.com',
    },
  });

  const tech = await prisma.user.upsert({
    where: { username: 'nicolas' },
    update: {},
    create: {
      username: 'nicolas',
      password: hashedPassword,
      name: 'Nicolas Elect',
      role: 'ELECTRICIEN',
      email: 'nicolas@novarea.com',
      instructions: 'Verify all meters at Sector B-12.'
    },
  });

  // 2. Event Types
  const eventTypes = [
    { code: 'PTR', description: 'Productions time reduce to 5h', category: 'POWER', type: 'DECREASE' },
    { code: 'GPO', description: 'General power went off', category: 'POWER', type: 'DECREASE' },
    { code: 'HSL', description: 'Heat style line turned off', category: 'POWER', type: 'DECREASE' },
    { code: 'OTH_P_D', description: 'Other Power Decrease', category: 'POWER', type: 'DECREASE' },
    { code: 'NLA', description: 'New line added', category: 'POWER', type: 'INCREASE' },
    { code: 'SLA', description: 'Simulation line added', category: 'POWER', type: 'INCREASE' },
    { code: 'WHL', description: 'Warehouse stayed till late', category: 'POWER', type: 'INCREASE' },
    { code: 'CDL', description: 'Cutting department stay long', category: 'POWER', type: 'INCREASE' },
    { code: 'OTH_P_I', description: 'Other Power Increase', category: 'POWER', type: 'INCREASE' },
    { code: 'LBA', description: 'Less boilers in activities', category: 'WATER', type: 'DECREASE' },
    { code: 'OTH_W_D', description: 'Other Water Decrease', category: 'WATER', type: 'DECREASE' },
    { code: 'ABO', description: 'All boilers are on', category: 'WATER', type: 'INCREASE' },
    { code: 'LTH', description: 'Ladies toilet highest consumption', category: 'WATER', type: 'INCREASE' },
    { code: 'BOP', description: 'Breaking of pipes', category: 'WATER', type: 'INCREASE' },
    { code: 'OTH_W_I', description: 'Other Water Increase', category: 'WATER', type: 'INCREASE' },
  ];

  const createdEventTypes = [];
  for (const et of eventTypes) {
    const created = await prisma.eventType.upsert({
      where: { code: et.code },
      update: et,
      create: et
    });
    createdEventTypes.push(created);
  }

  // 3. Clear existing transaction data to avoid duplicates in view
  await prisma.dailyEvent.deleteMany({});
  await prisma.consumption.deleteMany({});
  await prisma.meterReading.deleteMany({});

  // 4. Generate historical data (30 days)
  console.log('Generating rich historical data with events...');
  const today = startOfDay(new Date());

  for (let i = 30; i >= 0; i--) {
    const date = subDays(today, i);

    // Power Data
    const pVal = 2000 + (30 - i) * 120 + Math.random() * 40;
    const pPrev = pVal - (100 + Math.random() * 30);

    await prisma.meterReading.create({
        data: { userId: tech.id, category: 'POWER', value: pVal, timestamp: date, timeOfDay: 'EVENING' }
    });

    await prisma.consumption.create({
        data: { date, category: 'POWER', previousValue: pPrev, currentValue: pVal, consumption: pVal - pPrev }
    });

    // Water Data
    const wVal = 800 + (30 - i) * 15 + Math.random() * 5;
    const wPrev = wVal - (12 + Math.random() * 4);

    await prisma.meterReading.create({
        data: { userId: tech.id, category: 'WATER', value: wVal, timestamp: date, timeOfDay: 'EVENING' }
    });

    await prisma.consumption.create({
        data: { date, category: 'WATER', previousValue: wPrev, currentValue: wVal, consumption: wVal - wPrev }
    });

    // Add Strategic Events (Anomalies)
    // Every few days, add a reason for consumption changes
    if (i % 4 === 0) {
        // Power Anomaly
        const powerReason = createdEventTypes.find(t => t.category === 'POWER' && t.type === (Math.random() > 0.5 ? 'INCREASE' : 'DECREASE'));
        if (powerReason) {
            await prisma.dailyEvent.create({
                data: { date, eventTypeId: powerReason.id, comment: 'Seeded operational context' }
            });
        }
    }

    if (i % 7 === 0) {
        // Water Anomaly
        const waterReason = createdEventTypes.find(t => t.category === 'WATER' && t.type === 'INCREASE');
        if (waterReason) {
            await prisma.dailyEvent.create({
                data: { date, eventTypeId: waterReason.id, comment: 'Seeded leak investigation' }
            });
        }
    }
  }

  console.log('Seed completed successfully with events.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
