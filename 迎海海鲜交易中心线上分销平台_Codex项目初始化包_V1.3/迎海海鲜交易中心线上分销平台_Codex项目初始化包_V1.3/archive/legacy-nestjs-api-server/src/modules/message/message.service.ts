import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Pool } from "pg";
import { DATABASE_POOL } from "../../infrastructure/database/database.provider";

@Injectable()
export class MessageService {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async list(userId: string) {
    const result = await this.pool.query(
      `
        SELECT id, title, content, message_type, read_status, read_at, created_at
        FROM message
        WHERE user_id = $1 OR user_id IS NULL
        ORDER BY created_at DESC
        LIMIT 50
      `,
      [userId]
    );
    return result.rows;
  }

  async detail(userId: string, messageId: string) {
    const result = await this.pool.query(
      `
        SELECT id, title, content, message_type, read_status, read_at, created_at
        FROM message
        WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)
      `,
      [messageId, userId]
    );
    const message = result.rows[0];
    if (!message) {
      throw new NotFoundException("Message not found");
    }
    return message;
  }

  async markRead(userId: string, messageId: string) {
    const result = await this.pool.query(
      `
        UPDATE message
        SET read_status = 'read', read_at = COALESCE(read_at, now())
        WHERE id = $1 AND user_id = $2
        RETURNING id, read_status, read_at
      `,
      [messageId, userId]
    );
    if (!result.rows[0]) {
      throw new NotFoundException("Message not found");
    }
    return result.rows[0];
  }

  async markAllRead(userId: string) {
    const result = await this.pool.query(
      `
        UPDATE message
        SET read_status = 'read', read_at = COALESCE(read_at, now())
        WHERE user_id = $1 AND read_status = 'unread'
        RETURNING id
      `,
      [userId]
    );
    return { updated: result.rowCount };
  }

  async unreadCount(userId: string) {
    const result = await this.pool.query(
      `
        SELECT count(*)::int AS count
        FROM message
        WHERE user_id = $1 AND read_status = 'unread'
      `,
      [userId]
    );
    return result.rows[0];
  }
}
