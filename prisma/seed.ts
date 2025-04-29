import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// Unsplash image URLs - Free high-quality images
const UNSLASH_IMAGES = {
    users: {
        admin: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop',
        developer1: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop',
        developer2: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200&h=200&fit=crop',
        regularUser: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop'
    },
    issues: {
        login: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=600&h=400&fit=crop',
        profile: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=600&h=400&fit=crop',
        darkMode: 'https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?w=600&h=400&fit=crop'
    }
};

async function main() {
    try {
        console.log('🌱 Starting database seeding...');

        // Clear existing data
        console.log('🧹 Clearing existing data...');
        await clearDatabase();

        // Create users with Unsplash avatars
        console.log('👥 Creating users...');
        const { admin, developer1, developer2, regularUser } = await createUsers();

        // Create issues with Unsplash screenshots
        console.log('📝 Creating issues...');
        const { issue1, issue2, issue3 } = await createIssues(regularUser.id, admin.id, developer1.id, developer2.id);

        // Create related data
        console.log('🔗 Creating related records...');
        await createRelatedData({
            adminId: admin.id,
            developer1Id: developer1.id,
            developer2Id: developer2.id,
            regularUserId: regularUser.id,
            issue1Id: issue1.id,
            issue2Id: issue2.id,
            issue3Id: issue3.id
        });

        console.log('✅ Database seeded successfully!');
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Database operations
async function clearDatabase() {
    await prisma.$transaction([
        prisma.notification.deleteMany(),
        prisma.issueCommand.deleteMany(),
        prisma.issueImage.deleteMany(),
        prisma.issue.deleteMany(),
        prisma.user.deleteMany(),
        prisma.account.deleteMany(),
        prisma.session.deleteMany(),
        prisma.verificationToken.deleteMany()
    ]);
}

async function createUsers() {
    const [admin, developer1, developer2, regularUser] = await Promise.all([
        prisma.user.create({
            data: {
                name: 'Alex Johnson',
                email: 'admin@example.com',
                role: 1,
                password: await hash('admin123', 12),
                image: UNSLASH_IMAGES.users.admin,
                emailVerified: new Date(),
            },
        }),
        prisma.user.create({
            data: {
                name: 'Sam Taylor',
                email: 'dev1@example.com',
                role: 2,
                password: await hash('dev123', 12),
                image: UNSLASH_IMAGES.users.developer1,
                emailVerified: new Date(),
            },
        }),
        prisma.user.create({
            data: {
                name: 'Jordan Smith',
                email: 'dev2@example.com',
                role: 2,
                password: await hash('dev123', 12),
                image: UNSLASH_IMAGES.users.developer2,
                emailVerified: new Date(),
            },
        }),
        prisma.user.create({
            data: {
                name: 'Casey Brown',
                email: 'user@example.com',
                role: 0,
                password: await hash('user123', 12),
                image: UNSLASH_IMAGES.users.regularUser,
                emailVerified: new Date(),
            },
        })
    ]);

    return { admin, developer1, developer2, regularUser };
}

async function createIssues(regularUserId: string, adminId: string, dev1Id: string, dev2Id: string) {
    const [issue1, issue2, issue3] = await Promise.all([
        prisma.issue.create({
            data: {
                title: 'Login page authentication failure',
                description: 'Users receiving 500 errors when submitting login form. Issue occurs after recent API updates.',
                status: 'OPEN',
                priority: 'high',
                userId: regularUserId,
                assignedToUserId: dev1Id,
                assignedDate: new Date(),
            },
        }),
        prisma.issue.create({
            data: {
                title: 'Mobile profile layout issues',
                description: 'Profile page elements overlap on screens smaller than 400px width. Reported on iOS Safari.',
                status: 'IN_PROGRESS',
                priority: 'medium',
                userId: regularUserId,
                assignedToUserId: dev2Id,
                assignedDate: new Date(),
            },
        }),
        prisma.issue.create({
            data: {
                title: 'Dark mode implementation',
                description: 'Users requesting dark theme option to reduce eye strain during night usage.',
                status: 'OPEN',
                priority: 'low',
                userId: adminId,
            },
        })
    ]);

    return { issue1, issue2, issue3 };
}

async function createRelatedData(ids: {
    adminId: string;
    developer1Id: string;
    developer2Id: string;
    regularUserId: string;
    issue1Id: number;
    issue2Id: number;
    issue3Id: number;
}) {
    await Promise.all([
        // Issue screenshots from Unsplash
        prisma.issueImage.createMany({
            data: [
                {
                    issueId: ids.issue1Id,
                    imageUrl: UNSLASH_IMAGES.issues.login,

                },
                {
                    issueId: ids.issue2Id,
                    imageUrl: UNSLASH_IMAGES.issues.profile,

                },
                {
                    issueId: ids.issue3Id,
                    imageUrl: UNSLASH_IMAGES.issues.darkMode,

                }
            ],
        }),

        // Issue comments
        prisma.issueCommand.createMany({
            data: [
                {
                    issueId: ids.issue1Id,
                    userId: ids.developer1Id,
                    text: 'The error occurs in the auth middleware. Likely related to the JWT validation changes.',
                    likes: 2,
                    replies: JSON.stringify([{
                        userId: ids.adminId,
                        text: 'I\'ve rolled back the auth service temporarily',
                        timestamp: new Date()
                    }]),
                    timestamp: new Date(Date.now() - 43200000) // 12 hours ago
                },
                {
                    issueId: ids.issue1Id,
                    userId: ids.regularUserId,
                    text: 'Our customer support is getting flooded with complaints about this!',
                    likes: 0,
                    replies: JSON.stringify([]),
                    timestamp: new Date(Date.now() - 21600000) // 6 hours ago
                },
                {
                    issueId: ids.issue2Id,
                    userId: ids.developer2Id,
                    text: 'Found the CSS media query breakpoint issue. Fix in progress.',
                    likes: 1,
                    replies: JSON.stringify([]),
                    timestamp: new Date(Date.now() - 28800000) // 8 hours ago
                }
            ],
        }),

        // OAuth accounts
        prisma.account.createMany({
            data: [
                {
                    userId: ids.adminId,
                    type: 'oauth',
                    provider: 'google',
                    providerAccountId: 'google-123',
                    access_token: 'sample-google-token',
                    expires_at: Math.floor(Date.now() / 1000) + 3600
                },
                {
                    userId: ids.developer1Id,
                    type: 'oauth',
                    provider: 'github',
                    providerAccountId: 'github-456',
                    access_token: 'sample-github-token',
                    expires_at: Math.floor(Date.now() / 1000) + 3600
                },
            ],
        }),

        // Notifications
        prisma.notification.createMany({
            data: [
                {
                    title: 'New issue assigned',
                    message: 'You have been assigned to fix: Dark mode implementation',
                    type: 'assignment',
                    userId: ids.adminId,
                    senderId: ids.adminId,
                    issueId: ids.issue3Id,
                    createdAt: new Date(),
                    read: false
                },
                {
                    message: 'You have been assigned to fix: Login page authentication failure',
                    type: 'assignment',
                    title: 'New issue assigned',

                    userId: ids.developer1Id,
                    senderId: ids.adminId,
                    issueId: ids.issue1Id,
                    createdAt: new Date(Date.now() - 86400000), // 1 day ago
                    read: false
                },
                {
                    title: 'New issue assigned',

                    message: 'You have been assigned to fix: Mobile profile layout issues',
                    type: 'assignment',
                    userId: ids.developer2Id,
                    senderId: ids.adminId,
                    issueId: ids.issue2Id,
                    createdAt: new Date(Date.now() - 172800000), // 2 days ago
                    read: true
                },
                {
                    title: 'New issue assigned',

                    message: 'Casey Brown commented on your issue',
                    type: 'comment',
                    userId: ids.developer1Id,
                    senderId: ids.regularUserId,
                    issueId: ids.issue1Id,
                    createdAt: new Date(Date.now() - 21600000), // 6 hours ago
                    read: false
                },
                {
                    title: 'New issue assigned',

                    message: 'System maintenance scheduled for tonight at 2AM UTC',
                    type: 'system',
                    userId: ids.adminId,
                    senderId: ids.adminId,
                    createdAt: new Date(),
                    read: false
                }
            ],
        })
    ]);
}

main();