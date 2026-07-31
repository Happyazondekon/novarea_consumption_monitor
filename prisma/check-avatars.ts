const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { username: true, name: true, avatar: true }
  });
  console.log('Current Avatar data in DB:');
  users.forEach(u => {
    console.log(`- User: "${u.username}", Name: "${u.name}", Avatar present: ${!!u.avatar}`);
    if (u.avatar) {
      console.log(`  Data starts with: ${u.avatar.substring(0, 50)}...`);
    }
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
