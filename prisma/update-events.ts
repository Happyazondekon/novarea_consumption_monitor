import { PrismaClient } from '@prisma/client';
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Refining industrial event codes to FIT and MEF...');

  const eventTypes = [
    // --- POWER (Electricity) ---
    // INCREASES
    { code: 'NLA', description: 'New line Activated', category: 'POWER', type: 'INCREASE' },
    { code: 'SLA', description: 'Simulation line added', category: 'POWER', type: 'INCREASE' },
    { code: 'WHL', description: 'Warehouse stayed till late', category: 'POWER', type: 'INCREASE' },
    { code: 'CDL', description: 'Cutting department stay long', category: 'POWER', type: 'INCREASE' },
    { code: 'HBH', description: 'Human behavioral hiding', category: 'POWER', type: 'INCREASE' },
    { code: 'OII', description: 'Operational issue', category: 'POWER', type: 'INCREASE' },
    { code: 'OTHI', description: 'Other Increase', category: 'POWER', type: 'INCREASE' },

    // DECREASES
    { code: 'PTR', description: 'Productions time reduce to 5h', category: 'POWER', type: 'DECREASE' },
    { code: 'GPO', description: 'General power went off', category: 'POWER', type: 'DECREASE' },
    { code: 'HSL', description: 'Heat style line turned off', category: 'POWER', type: 'DECREASE' },
    { code: 'MEF', description: 'Mechanical failure', category: 'POWER', type: 'DECREASE' }, // Standardized to MEF
    { code: 'OID', description: 'Operational issue', category: 'POWER', type: 'DECREASE' },
    { code: 'OTHD', description: 'Other Decrease', category: 'POWER', type: 'DECREASE' },

    // --- WATER ---
    // INCREASES
    { code: 'ABO', description: 'All boilers are on', category: 'WATER', type: 'INCREASE' },
    { code: 'FIT', description: 'Fault in Toilets', category: 'WATER', type: 'INCREASE' }, // Standardized to FIT
    { code: 'BOP', description: 'Breaking of pipes', category: 'WATER', type: 'INCREASE' },
    { code: 'WBI', description: 'Human behavioral hiding', category: 'WATER', type: 'INCREASE' },
    { code: 'WOI', description: 'Operational issue', category: 'WATER', type: 'INCREASE' },
    { code: 'WOTI', description: 'Other Water Increase', category: 'WATER', type: 'INCREASE' },

    // DECREASES
    { code: 'LBA', description: 'Less boilers in activities', category: 'WATER', type: 'DECREASE' },
    { code: 'WMEF', description: 'Mechanical failure', category: 'WATER', type: 'DECREASE' }, // Water MEF
    { code: 'WOD', description: 'Operational issue', category: 'WATER', type: 'DECREASE' },
    { code: 'WOTD', description: 'Other Water Decrease', category: 'WATER', type: 'DECREASE' },
  ];

  // Atomic sync
  await prisma.$transaction([
      prisma.dailyEvent.deleteMany({}),
      prisma.eventType.deleteMany({}),
  ]);

  for (const et of eventTypes) {
    await prisma.eventType.create({
      data: et
    });
  }

  console.log('✅ Industrial event codes (FIT/MEF) synchronized successfully.');
}

main()
  .catch((e) => {
    console.error('❌ CRITICAL ERROR DURING SYNC:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
