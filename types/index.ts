export type AppUser = {
  uid: string;
  anonymousName: string;
  avatar: string;
  createdAt?: any;
  lastActive?: unknown;
  banned?: boolean;
  deviceInfo?: string;
  ipAddress?: string;
  deviceFingerprint?: string;
};

export type Room = {
  id: string;
  name: string;
  description: string;
  type: "public" | "private";
  roomCode: string;
  createdBy: string;
  createdAt?: any;
  activeUsers: number;
  isActive: boolean;
};

export type Message = {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  createdAt?: any;
  deleted: boolean;
  reported: boolean;
  imageUrl?: string;
  audioUrl?: string;
  audioDuration?: number;
  reactions?: { [emoji: string]: string[] }; // emoji character -> list of user UIDs who reacted
  replyTo?: { id: string; text: string; senderName: string };
  expiresAt?: any;
  viewOnce?: boolean;
  viewedBy?: string[];
  poll?: {
    question: string;
    options: {
      text: string;
      votes: string[];
    }[];
  };
};
