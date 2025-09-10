import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { ChatService } from './chat.database.js';
import { MessageStatus, MessageType } from './chat.model.js';
import type { 
  ServerToClientEvents, 
  ClientToServerEvents, 
  InterServerEvents, 
  SocketData 
} from './chat.model.js';

// Store online users and their socket IDs
const onlineUsers = new Map<string, string>();
const userRooms = new Map<string, string>();

export class ChatSocketService {
  private io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

  constructor(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: "*", // Configure this properly for production
        methods: ["GET", "POST"]
      }
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on("connection", (socket) => {
      console.log(`User connected: ${socket.id}`);

      // Handle user joining a chat room
      socket.on("join_room", async (data) => {
        try {
          const { userId, otherUserId } = data;
          const roomId = ChatService.generateRoomId(userId, otherUserId);
          
          // Leave previous room if any
          const previousRoom = userRooms.get(userId);
          if (previousRoom) {
            socket.leave(previousRoom);
          }

          // Join new room
          socket.join(roomId);
          userRooms.set(userId, roomId);
          onlineUsers.set(userId, socket.id);
          
          // Store user data in socket
          socket.data.userId = userId;
          socket.data.roomId = roomId;

          // Notify other user that this user is online
          socket.to(roomId).emit("user_online", { userId });

          console.log(`User ${userId} joined room: ${roomId}`);
        } catch (error) {
          console.error("Error joining room:", error);
        }
      });

      // Handle sending messages
      socket.on("send_message", async (data) => {
        try {
          const { senderId, receiverId, content, messageType = MessageType.TEXT } = data;
          const roomId = ChatService.generateRoomId(senderId, receiverId);

          // Save message to database
          const savedMessage = await ChatService.saveMessage({
            senderId,
            receiverId,
            content,
            messageType,
            chatRoomId: roomId
          });

          // Emit message to room participants
          this.io.to(roomId).emit("message_received", savedMessage);

          // Mark as delivered if receiver is online
          const receiverSocketId = onlineUsers.get(receiverId);
          if (receiverSocketId && savedMessage._id) {
            await ChatService.updateMessageStatus(savedMessage._id.toString(), MessageStatus.DELIVERED);
            
            this.io.to(roomId).emit("message_status_updated", {
              messageId: savedMessage._id.toString(),
              status: MessageStatus.DELIVERED
            });
          }

          console.log(`Message sent from ${senderId} to ${receiverId}`);
        } catch (error) {
          console.error("Error sending message:", error);
        }
      });

      // Handle typing indicators
      socket.on("typing", (data) => {
        const { userId, isTyping, roomId } = data;
        socket.to(roomId).emit("user_typing", { userId, isTyping });
      });

      // Handle marking messages as read
      socket.on("mark_as_read", async (data) => {
        try {
          const { messageId, userId } = data;
          
          const updatedMessage = await ChatService.updateMessageStatus(messageId, MessageStatus.READ);
          
          if (updatedMessage) {
            // Notify sender that message was read
            this.io.to(updatedMessage.chatRoomId).emit("message_status_updated", {
              messageId: messageId,
              status: MessageStatus.READ
            });
          }
        } catch (error) {
          console.error("Error marking message as read:", error);
        }
      });

      // Handle user disconnection
      socket.on("disconnect", () => {
        const userId = socket.data.userId;
        const roomId = socket.data.roomId;

        if (userId) {
          onlineUsers.delete(userId);
          userRooms.delete(userId);

          // Notify room that user went offline
          if (roomId) {
            socket.to(roomId).emit("user_offline", { userId });
          }
        }

        console.log(`User disconnected: ${socket.id}`);
      });
    });
  }

  // Method to send message from server (useful for system messages)
  public async sendSystemMessage(roomId: string, content: string) {
    this.io.to(roomId).emit("message_received", {
      senderId: "system",
      receiverId: "all",
      content,
      messageType: MessageType.TEXT,
      timestamp: new Date(),
      status: MessageStatus.SENT,
      chatRoomId: roomId
    } as any);
  }

  // Get online users count
  public getOnlineUsersCount(): number {
    return onlineUsers.size;
  }

  // Check if user is online
  public isUserOnline(userId: string): boolean {
    return onlineUsers.has(userId);
  }
}