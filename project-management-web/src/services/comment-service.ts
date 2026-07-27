import apiClient from './api-client';

export interface CommentAuthor {
  _id: string;
  name: string;
  avatarUrl?: string;
}

export interface Comment {
  _id: string;
  taskId: string;
  authorId: CommentAuthor;
  content: string | Record<string, unknown>;
  parentId?: string;
  isPinned?: boolean;
  reactions?: { emoji: string; userIds: string[] }[];
  createdAt: string;
  updatedAt: string;
}

function extractText(content: string | Record<string, unknown>): string {
  if (typeof content === 'string') return content;
  // Tiptap JSON → plain text fallback
  try {
    const doc = content as { content?: Array<{ content?: Array<{ text?: string }> }> };
    return (
      doc.content
        ?.flatMap((block) => block.content?.map((n) => n.text || '') || [])
        .join('') || JSON.stringify(content)
    );
  } catch {
    return '';
  }
}

export const commentService = {
  async getByTask(taskId: string): Promise<Comment[]> {
    const response = await apiClient.get(`/tasks/${taskId}/comments`);
    return response.data.data;
  },

  async create(taskId: string, content: string): Promise<Comment> {
    // Store as simple Tiptap-compatible JSON doc
    const tiptapDoc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: content ? [{ type: 'text', text: content }] : [],
        },
      ],
    };
    const response = await apiClient.post(`/tasks/${taskId}/comments`, { content: tiptapDoc });
    return response.data.data;
  },

  async update(commentId: string, content: string): Promise<Comment> {
    const tiptapDoc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: content ? [{ type: 'text', text: content }] : [],
        },
      ],
    };
    const response = await apiClient.patch(`/comments/${commentId}`, { content: tiptapDoc });
    return response.data.data;
  },

  async delete(commentId: string): Promise<void> {
    await apiClient.delete(`/comments/${commentId}`);
  },

  extractText,
};

export default commentService;
