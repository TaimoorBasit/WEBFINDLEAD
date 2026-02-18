
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = process.argv[2];
    if (!email) {
        console.error('Please provide an email address.');
        process.exit(1);
    }

    try {
        const user = await prisma.user.update({
            where: { email: email },
            data: { role: 'ADMIN' },
        });
        console.log(`User ${email} promoted to ADMIN.`);
    } catch (error) {
        console.error(`Failed to update user: ${error.message}`);
    } finally {
        await prisma.$disconnect();
    }
}

main();
