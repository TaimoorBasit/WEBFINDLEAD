const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const email = 'admin@webfind.com';
    const password = await bcrypt.hash('admin123', 10);

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.log(`User ${email} does not exist. Creating...`);
            await prisma.user.create({
                data: {
                    email,
                    password,
                    role: 'ADMIN',
                    name: 'System Admin'
                }
            });
        } else {
            await prisma.user.update({
                where: { email },
                data: { password }
            });
        }
        console.log(`Password for ${email} is now 'admin123'.`);
    } catch (error) {
        console.error("Error:", error);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
