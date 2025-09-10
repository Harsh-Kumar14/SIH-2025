import mongoose, { Schema, Document } from "mongoose";
import { z } from "zod";

// Message status enum
export enum MessageStatus {
  SENT = "sent",
  DELIVERED = "delivered",
  READ = "read"
}

// Message type enum
export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  FILE = "file"
}

// Zod schema for message validation
export const MessageSchemaZod = z.object({
  senderId: z.string().min(1),
  receiverId: z.string().min(1),
  content: z.string().min(1),
  messageType: z.nativeEnum(MessageType).default(MessageType.TEXT),
  timestamp: z.date().default(() => new Date()),
  status: z.nativeEnum(MessageStatus).default(MessageStatus.SENT)
});

// TypeScript interface for Message Document
export interface MessageDocument extends Document {
  senderId: string;
  receiverId: string;
  content: string;
  messageType: MessageType;
  timestamp: Date;
  status: MessageStatus;
  chatRoomId: string;
}

// MongoDB Schema for Message
const MessageSchema = new Schema<MessageDocument>({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  content: { type: String, required: true },
  messageType: { 
    type: String, 
    enum: Object.values(MessageType),
    default: MessageType.TEXT 
  },
  timestamp: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: Object.values(MessageStatus),
    default: MessageStatus.SENT 
  },
  chatRoomId: { type: String, required: true }
});

// Create indexes for better query performance
MessageSchema.index({ chatRoomId: 1, timestamp: -1 });
MessageSchema.index({ senderId: 1, receiverId: 1 });

export const Message = mongoose.model<MessageDocument>("Message", MessageSchema);

// Chat Room interface for typing users
export interface ChatRoom {
  roomId: string;
  participants: string[];
  createdAt: Date;
}

// Socket event types
export interface ServerToClientEvents {
  message_received: (data: MessageDocument) => void;
  user_typing: (data: { userId: string; isTyping: boolean }) => void;
  user_online: (data: { userId: string }) => void;
  user_offline: (data: { userId: string }) => void;
  message_status_updated: (data: { messageId: string; status: MessageStatus }) => void;
}

export interface ClientToServerEvents {
  join_room: (data: { userId: string; otherUserId: string }) => void;
  send_message: (data: { 
    senderId: string; 
    receiverId: string; 
    content: string; 
    messageType?: MessageType;
  }) => void;
  typing: (data: { userId: string; isTyping: boolean; roomId: string }) => void;
  mark_as_read: (data: { messageId: string; userId: string }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  roomId: string;
}
