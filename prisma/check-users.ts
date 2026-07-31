const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Current users in DB:');
  users.forEach(u => {
    console.log(`- Username: "${u.username}", Role: ${u.role}, Pwd: ${u.password.substring(0, 10)}...`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
