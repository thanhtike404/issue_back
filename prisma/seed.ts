/// <reference types="node" />
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
    },
    chats: {
        devTeam: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=200&h=200&fit=crop',
        weekendTrip: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=200&h=200&fit=crop',
        private: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=200&h=200&fit=crop'
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

        // Create chats and messages
        console.log('💬 Creating chats and messages...');
        await createChatData({
            adminId: admin.id,
            developer1Id: developer1.id,
            developer2Id: developer2.id,
            regularUserId: regularUser.id
        });

        console.log('✅ Database seeded successfully!');
    } catch (error) {
        console.error('❌ Seed failed:', error);
        // Not using process.exit, just disconnect and let the script end naturally
    } finally {
        await prisma.$disconnect();
    }
}

async function clearDatabase() {
    await prisma.$transaction([
        prisma.message.deleteMany(),
        prisma.userChat.deleteMany(),
        prisma.chat.deleteMany(),
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
                    storageType: 'CLOUDINARY'
                },
                {
                    issueId: ids.issue2Id,
                    imageUrl: UNSLASH_IMAGES.issues.profile,
                    storageType: 'CLOUDINARY'
                },
                {
                    issueId: ids.issue3Id,
                    imageUrl: UNSLASH_IMAGES.issues.darkMode,
                    storageType: 'CLOUDINARY'
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
                    title: 'New comment',
                    message: 'Casey Brown commented on your issue',
                    type: 'comment',
                    userId: ids.developer1Id,
                    senderId: ids.regularUserId,
                    issueId: ids.issue1Id,
                    createdAt: new Date(Date.now() - 21600000), // 6 hours ago
                    read: false
                },
                {
                    title: 'System notification',
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

async function createChatData(ids: {
    adminId: string;
    developer1Id: string;
    developer2Id: string;
    regularUserId: string;
}) {
    // Create private chat between admin and regular user
    const privateChat = await prisma.chat.create({
        data: {
            id: 'chat1', // Adding explicit ID to avoid auto-generation issues
            name: 'Alex & Casey',
            type: 'PRIVATE',
            avatar: UNSLASH_IMAGES.chats.private,
            updatedAt: new Date(),
            userChats: {
                create: [
                    { 
                        id: 'uc1',
                        userId: ids.adminId 
                    },
                    { 
                        id: 'uc2',
                        userId: ids.regularUserId, 
                        lastReadAt: new Date(Date.now() - 3600000) 
                    }
                ]
            },
            messages: {
                create: [
                    {
                        id: 'msg1',
                        content: 'Hey Casey, can you check the latest issue report?',
                        senderId: ids.adminId,
                        timestamp: new Date(Date.now() - 7200000),
                        read: true,
                    },
                    {
                        id: 'msg2',
                        content: 'Sure Alex, I just looked at it. The login issue seems serious.',
                        senderId: ids.regularUserId,
                        timestamp: new Date(Date.now() - 7000000),
                        read: true,
                    },
                    {
                        id: 'msg3',
                        content: 'I assigned Sam to work on it. Should be fixed soon.',
                        senderId: ids.adminId,
                        timestamp: new Date(Date.now() - 6900000),
                        read: true,
                    },
                    {
                        id: 'msg4',
                        content: 'Great! Our users will be relieved.',
                        senderId: ids.regularUserId,
                        timestamp: new Date(Date.now() - 6800000),
                        read: true,
                    },
                    {
                        id: 'msg5',
                        content: 'Let me know if you find anything else concerning.',
                        senderId: ids.adminId,
                        timestamp: new Date(Date.now() - 6700000),
                        read: false,
                    },
                ],
            },
        },
    });

    // Create Dev Team group chat
    const devTeamChat = await prisma.chat.create({
        data: {
            id: 'chat2', // Adding explicit ID
            name: 'Dev Team',
            type: 'GROUP',
            avatar: UNSLASH_IMAGES.chats.devTeam,
            updatedAt: new Date(),
            userChats: {
                create: [
                    { id: 'uc3', userId: ids.adminId },
                    { id: 'uc4', userId: ids.developer1Id },
                    { id: 'uc5', userId: ids.developer2Id }
                ]
            },
            messages: {
                create: [
                    {
                        id: 'msg6',
                        content: 'Morning team! Any updates on the login issue?',
                        senderId: ids.adminId,
                        timestamp: new Date(Date.now() - 600000),
                        read: true,
                    },
                    {
                        id: 'msg7',
                        content: 'Working on it now. Found the bug in auth middleware.',
                        senderId: ids.developer1Id,
                        timestamp: new Date(Date.now() - 550000),
                        read: true,
                    },
                    {
                        id: 'msg8',
                        content: 'I can help with testing once you push the fix.',
                        senderId: ids.developer2Id,
                        timestamp: new Date(Date.now() - 500000),
                        read: true,
                    },
                ],
            },
        },
    });

    // Create Weekend Trip group chat
    const weekendTripChat = await prisma.chat.create({
        data: {
            id: 'chat3', // Adding explicit ID
            name: 'Weekend Trip',
            type: 'GROUP',
            avatar: UNSLASH_IMAGES.chats.weekendTrip,
            updatedAt: new Date(),
            userChats: {
                create: [
                    { id: 'uc6', userId: ids.adminId },
                    { id: 'uc7', userId: ids.developer1Id },
                    { id: 'uc8', userId: ids.developer2Id },
                    { id: 'uc9', userId: ids.regularUserId }
                ]
            },
            messages: {
                create: [
                    {
                        id: 'msg9',
                        content: 'Who\'s ready for the team retreat this weekend?',
                        senderId: ids.adminId,
                        timestamp: new Date(Date.now() - 1200000),
                        read: true,
                    },
                    {
                        id: 'msg10',
                        content: 'I am! Been looking forward to this.',
                        senderId: ids.developer2Id,
                        timestamp: new Date(Date.now() - 1100000),
                        read: true,
                    },
                    {
                        id: 'msg11',
                        content: 'I\'ll bring some board games.',
                        senderId: ids.regularUserId,
                        timestamp: new Date(Date.now() - 1050000),
                        read: true,
                    },
                    {
                        id: 'msg12',
                        content: 'Don\'t forget to pack warm clothes - forecast says it might rain.',
                        senderId: ids.developer1Id,
                        timestamp: new Date(Date.now() - 1000000),
                        read: false,
                    },
                ],
            },
        },
    });

    // Update unread counts for demonstration
    await prisma.userChat.updateMany({
        where: {
            chatId: privateChat.id,
            userId: ids.adminId
        },
        data: {
            unreadCount: 1
        }
    });

    await prisma.userChat.updateMany({
        where: {
            chatId: weekendTripChat.id,
            userId: ids.adminId
        },
        data: {
            unreadCount: 1
        }
    });

    return { privateChat, devTeamChat, weekendTripChat };
}

main();