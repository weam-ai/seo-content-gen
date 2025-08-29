// export type TypeComment = {
//   id: string;
//   user_id: string;
//   message: string;
//   created_at: Date;
//   updated_at: Date;
// };

// export type TypeThread = {
//   id: string;
//   selectedText: string;
//   comments: TypeComment[];
//   created_at: Date;
//   updated_at: Date;
// };

export interface MarkerPosition {
  from: number;
  to: number;
}

export interface Metadata {
  blockId: string;
  markerPosition: MarkerPosition;
}

export interface TextContent {
  type: 'text';
  text: string;
  styles: Record<string, any>;
}

export interface Block {
  id: string;
  type: 'paragraph'; // Extendable for other block types
  props: Record<string, any>;
  content: TextContent[];
  children: Block[]; // Nested blocks, if any
}

export interface CommentType {
  type: 'comment';
  id: string;
  threadId: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  userId: string;
  body: Block[];
  metadata: Metadata;
  reactions: any[]; // Define more precisely if needed
}

export interface Thread {
  type: 'thread';
  id: string;
  comments: CommentType[];
  createdAt: string;
  updatedAt: string;
  resolved: boolean;
  blockId: string;
  metadata: Metadata;
  markerPosition: MarkerPosition;
}

export type ThreadList = Thread[];
