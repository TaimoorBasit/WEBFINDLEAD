const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { email: true }
    });

    console.log("Admin Users:", admins);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
