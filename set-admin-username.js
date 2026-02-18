const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'admin@webfind.com';

    const user = await prisma.user.update({
        where: { email },
        data: {
            username: 'Admin', // Set username
        },
    });

    console.log('Admin user updated with username:', user);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
