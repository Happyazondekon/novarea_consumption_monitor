import { PrismaClient } from '@prisma/client';
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 STARTING SURGICAL DATA PURGE (Novarea Monitoring)...');

  try {
    // We purge transaction tables only.
    // WE DO NOT TOUCH: User, EventType

    await prisma.$transaction([
        prisma.dailyEvent.deleteMany({}),
        prisma.consumption.deleteMany({}),
        prisma.meterReading.deleteMany({}),
        prisma.instruction.deleteMany({}),
    ]);

    console.log('✅ PURGE COMPLETE.');
    console.log('-------------------------------------------');
    console.log('🛡️  SECURITY REPORT:');
    console.log('- User Accounts: PRESERVED');
    console.log('- Access Credentials: PRESERVED');
    console.log('- Event Dictionary (Codes): PRESERVED');
    console.log('- Meter Readings: DELETED');
    console.log('- Consumption Deltas: DELETED');
    console.log('- Daily Context Logs: DELETED');
    console.log('- Mission Instructions: DELETED');
    console.log('-------------------------------------------');

  } catch (error) {
    console.error('❌ CRITICAL ERROR DURING PURGE:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
