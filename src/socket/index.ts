import { PrismaClient } from "@prisma/client";

export const socketInit = (io: any) => {
  const prismaClient = new PrismaClient();
  const connectedUsers = new Map<string, { socketId: string; email: string; id: number }>();

  // Utility function to safely handle socket actions
  const safeSocketAction = async (socket: any, action: () => Promise<void>) => {
    try {
      await action();
    } catch (error) {
      console.error("Socket action error:", error);
      socket.emit("error", { error: "An unexpected error occurred. Please try again later." });
    }
  };

  // Emit comments to the client
  const emitComments = async (socket: any, issueId: number) => {
    try {
      const comments = await prismaClient.issueCommand.findMany({ where: { issueId } });
      socket.emit("fetch-comments", comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      socket.emit("fetch-comments-error", { error: "Failed to fetch comments. Please try again later." });
    }
  };

  // Handle socket connection
  io.on("connection", (socket: any) => {
    const { email } = socket.handshake.auth;

    if (!email) {
      console.warn("Connection attempt without email. Disconnecting...");
      socket.disconnect(true);
      return;
    }

    console.log(`User connected: ${email} (Socket ID: ${socket.id})`);
    socket.emit("connected", { message: "Connected successfully", socketId: socket.id });

    // Handle fetching comments
    socket.on("get-comments", (issueId: number) => {
      safeSocketAction(socket, async () => {
        console.log("Fetching comments for issue ID:", issueId);
        await emitComments(socket, issueId);
      });
    });

    // Handle adding a new comment
    socket.on("add-comment", (data: { issueId: number; userId: number; text: string; timestamp: Date }) => {
      safeSocketAction(socket, async () => {
        console.log("Adding comment to issue ID:", data.issueId);

        // Add the new comment to the database
        await prismaClient.issueCommand.create({
          data: {
            issueId: data.issueId, // This is fine if issueId is a number
            userId: data.userId.toString(), // Convert userId to string
            text: data.text,
            timestamp: data.timestamp,
            likes: 0,
          },
        });


        console.log("Comment added successfully. Fetching updated comments...");

        // Fetch updated comments
        const comments = await prismaClient.issueCommand.findMany({ where: { issueId: data.issueId } });

        // Broadcast updated comments to all connected sockets
        io.emit("fetch-comments", comments);
      });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${email} (Socket ID: ${socket.id})`);
      connectedUsers.delete(email);
    });
  });
};
