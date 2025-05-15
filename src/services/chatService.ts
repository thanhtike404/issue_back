
import { PrismaClient } from '@prisma/client';
import { Server, Socket } from 'socket.io';

export default class ChatService {
    private prisma: PrismaClient;

    constructor(private io: Server) {
        this.prisma = new PrismaClient();
    }

getUserChats = async (data:any, callback:any) => {
  try {
    const { userId } = data;

    const chats = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
          userChats: {
            include: {
              chat: {
                include: {
                  messages: true
                }
              }
            }
          }
        }
      }
    );
    console.log(chats,'chats')
    callback({ success: true, chats });
  } catch (error) {
    console.error('Error fetching chats:', error);
    callback({ success: false, error: 'Failed to fetch user chats' });
  }
}

}