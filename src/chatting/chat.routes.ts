import express from 'express';
import { ChatService } from './chat.database.js';
import { MessageSchemaZod } from './chat.model.js';
import type { Request, Response } from 'express';

const router = express.Router();

// Get chat history between two users
router.get('/history/:userId1/:userId2', async (req: Request, res: Response) => {
  try {
    const { userId1, userId2 } = req.params;
    
    if (!userId1 || !userId2) {
      return res.status(400).json({
        success: false,
        message: 'Both userId1 and userId2 are required'
      });
    }
    
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const messages = await ChatService.getChatHistory(userId1, userId2, limit, offset);
    
    res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        limit,
        offset,
        count: messages.length
      }
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat history'
    });
  }
});

// Get recent chats for a user
router.get('/recent/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }
    
    const limit = parseInt(req.query.limit as string) || 20;

    const recentChats = await ChatService.getRecentChats(userId, limit);
    
    res.status(200).json({
      success: true,
      data: recentChats
    });
  } catch (error) {
    console.error('Error fetching recent chats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent chats'
    });
  }
});

// Get unread message count
router.get('/unread/:userId/:otherUserId', async (req: Request, res: Response) => {
  try {
    const { userId, otherUserId } = req.params;

    if (!userId || !otherUserId) {
      return res.status(400).json({
        success: false,
        message: 'Both userId and otherUserId are required'
      });
    }

    const unreadCount = await ChatService.getUnreadCount(userId, otherUserId);
    
    res.status(200).json({
      success: true,
      data: {
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count'
    });
  }
});

// Mark messages as read
router.put('/mark-read', async (req: Request, res: Response) => {
  try {
    const { senderId, receiverId } = req.body;

    if (!senderId || !receiverId) {
      return res.status(400).json({
        success: false,
        message: 'senderId and receiverId are required'
      });
    }

    await ChatService.markMessagesAsRead(senderId, receiverId);
    
    res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read'
    });
  }
});

// Send a message via HTTP (alternative to Socket.IO)
router.post('/send', async (req: Request, res: Response) => {
  try {
    const result = MessageSchemaZod.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message data',
        errors: result.error.issues
      });
    }

    const { senderId, receiverId, content, messageType } = result.data;
    const chatRoomId = ChatService.generateRoomId(senderId, receiverId);

    const savedMessage = await ChatService.saveMessage({
      senderId,
      receiverId,
      content,
      messageType,
      chatRoomId
    });

    res.status(201).json({
      success: true,
      data: savedMessage,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

export { router as chatRoutes };
