import { PrismaClient } from "@prisma/client";

export const socketInit = (io: any) => {
  const prismaClient = new PrismaClient();

  const safeSocketAction = async (socket: any, action: () => Promise<void>) => {
    try {
      await action();
    } catch (error) {
      console.error("Socket action error:", error);
      socket.emit("error", { error: "An unexpected error occurred. Please try again later." });
    }
  };
  const emitComments = async (socket: any, issueId: number) => {
    try {
      const getComments = await prismaClient.issueCommand.findMany({
        where: { issueId },
        include: {
          user: {
            select: { email: true, id: true, name: true },
          },
        },
      });

      const comments = getComments.map(comment => {
        console.log("Raw replies before parsing:", comment.replies); // Debugging log
        return {
          ...comment,
          replies: Array.isArray(comment.replies)
            ? comment.replies
            : comment.replies && comment.replies !== ""
              // @ts-ignore
              ? JSON.parse(comment.replies)
              : [],
        };
      });

      console.log("Fetched comments:", comments);
      io.emit("fetch-comments", comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      socket.emit("fetch-comments-error", { error: "Failed to fetch comments. Please try again later." });
    }
  };



  io.on("connection", (socket: any) => {
    const { email } = socket.handshake.auth;

    if (!email) {
      console.warn("Connection attempt without email. Disconnecting...");
      socket.disconnect(true);
      return;
    }

    console.log(`User connected: ${email} (Socket ID: ${socket.id})`);
    socket.emit("connected", { message: "Connected successfully", socketId: socket.id });

    socket.on("get-comments", (issueId: number) => {
      safeSocketAction(socket, async () => {
        console.log("Fetching comments for issue ID:", issueId);
        await emitComments(socket, issueId);
      });
    });

    socket.on("add-comment", (data: { issueId: number; userId: number; text: string; timestamp: Date }) => {
      safeSocketAction(socket, async () => {
        console.log("Adding comment to issue ID:", data.issueId);

        await prismaClient.issueCommand.create({
          data: {
            issueId: data.issueId,
            userId: data.userId.toString(),
            text: data.text,
            timestamp: data.timestamp,
            likes: 0,
            replies: "[]", // Initialize as an empty array
          },
        });

        console.log("Comment added successfully.");

        await emitComments(socket, data.issueId);
      });
    });

    // ADD REPLY FUNCTIONALITY
    socket.on("add-reply", async (data: { commentId: number; userId: number; text: string }) => {
      safeSocketAction(socket, async () => {
        console.log(`Adding reply to comment ID: ${data.commentId}`);

        const comment = await prismaClient.issueCommand.findUnique({
          where: { id: data.commentId },
        });

        if (!comment) {
          console.log("Comment not found.");
          socket.emit("error", { error: "Comment not found." });
          return;
        }

        let replies = [];
        try {
          // @ts-ignore
          replies = comment.replies && comment.replies.trim() !== "" ? JSON.parse(comment.replies as string) : [];
        } catch (error) {
          console.error("Error parsing replies JSON:", error);
          replies = [];
        }

        const newReply = {
          id: Date.now(),
          userId: data.userId,
          text: data.text,
          timestamp: new Date().toISOString(),
          likes: 0,
        };

        replies.push(newReply);

        await prismaClient.issueCommand.update({
          where: { id: data.commentId },
          data: { replies: JSON.stringify(replies) },
        });

        console.log("Reply added successfully.");
        await emitComments(socket, comment.issueId);
      });
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${email} (Socket ID: ${socket.id})`);
    });
  });
};
