const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const username = 'Admin';
    const email = 'admin@webfind.com';

    // Hash password "admin123"
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const user = await prisma.user.upsert({
        where: { username },
        update: {
            role: 'ADMIN',
            isVerified: true,
            password: hashedPassword,
            email: email, // Keep email as backup/identifier
        },
        create: {
            username,
            email,
            name: 'Admin User',
            password: hashedPassword,
            role: 'ADMIN',
            isVerified: true,
            plan: 'FREE',
            leadsBalance: 10000,
        },
    });

    console.log('Admin user updated with username:', user.username);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
