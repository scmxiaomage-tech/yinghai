import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Pool } from "pg";
import { DATABASE_POOL } from "../../infrastructure/database/database.provider";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Injectable()
export class UserService {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async getProfile(userId: string) {
    const result = await this.pool.query(
      `
        SELECT u.id AS user_id, u.openid, u.unionid, u.phone, u.status,
               p.nickname, p.avatar_url, p.gender, p.birthday, p.bio,
               p.created_at, p.updated_at
        FROM users u
        LEFT JOIN user_profile p ON p.user_id = u.id
        WHERE u.id = $1 AND u.deleted_at IS NULL
      `,
      [userId]
    );
    const profile = result.rows[0];
    if (!profile) {
      throw new NotFoundException("User not found");
    }
    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    await this.pool.query(
      `
        INSERT INTO user_profile (user_id, nickname, avatar_url, gender, birthday, bio, updated_at)
        VALUES ($1, $2, $3, COALESCE($4, 'unknown'), $5, $6, now())
        ON CONFLICT (user_id)
        DO UPDATE SET nickname = COALESCE(EXCLUDED.nickname, user_profile.nickname),
                      avatar_url = COALESCE(EXCLUDED.avatar_url, user_profile.avatar_url),
                      gender = COALESCE(EXCLUDED.gender, user_profile.gender),
                      birthday = COALESCE(EXCLUDED.birthday, user_profile.birthday),
                      bio = COALESCE(EXCLUDED.bio, user_profile.bio),
                      updated_at = now()
      `,
      [
        userId,
        dto.nickname ?? null,
        dto.avatarUrl ?? null,
        dto.gender ?? null,
        dto.birthday ?? null,
        dto.bio ?? null
      ]
    );
    return this.getProfile(userId);
  }
}
