import { Message, MessageStatus, MessageType } from './chat.model.js';
import type { MessageDocument } from './chat.model.js';

export class ChatService {
  
  // Save a message to the database
  static async saveMessage(messageData: {
    senderId: string;
    receiverId: string;
    content: string;
    messageType?: MessageType;
    chatRoomId: string;
  }): Promise<MessageDocument> {
    try {
      const message = new Message({
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
        content: messageData.content,
        messageType: messageData.messageType || MessageType.TEXT,
        chatRoomId: messageData.chatRoomId,
        timestamp: new Date(),
        status: MessageStatus.SENT
      });

      const savedMessage = await message.save();
      return savedMessage;
    } catch (error) {
      console.error('Error saving message:', error);
      throw new Error('Failed to save message');
    }
  }

  // Get chat history between two users
  static async getChatHistory(
    userId1: string, 
    userId2: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<MessageDocument[]> {
    try {
      const chatRoomId = this.generateRoomId(userId1, userId2);
      
      const messages = await Message.find({
        chatRoomId: chatRoomId
      })
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(offset)
      .exec();

      return messages.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw new Error('Failed to fetch chat history');
    }
  }

  // Update message status (delivered, read)
  static async updateMessageStatus(
    messageId: string, 
    status: MessageStatus
  ): Promise<MessageDocument | null> {
    try {
      const updatedMessage = await Message.findByIdAndUpdate(
        messageId,
        { status: status },
        { new: true }
      );
      
      return updatedMessage;
    } catch (error) {
      console.error('Error updating message status:', error);
      throw new Error('Failed to update message status');
    }
  }

  // Mark all messages as read for a user in a chat
  static async markMessagesAsRead(
    senderId: string, 
    receiverId: string
  ): Promise<void> {
    try {
      const chatRoomId = this.generateRoomId(senderId, receiverId);
      
      await Message.updateMany(
        {
          chatRoomId: chatRoomId,
          senderId: senderId,
          status: { $ne: MessageStatus.READ }
        },
        { status: MessageStatus.READ }
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw new Error('Failed to mark messages as read');
    }
  }

  // Get unread message count
  static async getUnreadCount(userId: string, otherUserId: string): Promise<number> {
    try {
      const chatRoomId = this.generateRoomId(userId, otherUserId);
      
      const count = await Message.countDocuments({
        chatRoomId: chatRoomId,
        receiverId: userId,
        status: { $ne: MessageStatus.READ }
      });
      
      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Generate a consistent room ID for two users
  static generateRoomId(userId1: string, userId2: string): string {
    // Sort the IDs to ensure consistent room ID regardless of order
    const sortedIds = [userId1, userId2].sort();
    return `chat_${sortedIds[0]}_${sortedIds[1]}`;
  }

  // Get recent chats for a user
  static async getRecentChats(userId: string, limit: number = 20): Promise<any[]> {
    try {
      const recentChats = await Message.aggregate([
        {
          $match: {
            $or: [
              { senderId: userId },
              { receiverId: userId }
            ]
          }
        },
        {
          $sort: { timestamp: -1 }
        },
        {
          $group: {
            _id: "$chatRoomId",
            lastMessage: { $first: "$$ROOT" },
            unreadCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$receiverId", userId] },
                      { $ne: ["$status", MessageStatus.READ] }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $sort: { "lastMessage.timestamp": -1 }
        },
        {
          $limit: limit
        }
      ]);

      return recentChats;
    } catch (error) {
      console.error('Error getting recent chats:', error);
      throw new Error('Failed to get recent chats');
    }
  }
}
