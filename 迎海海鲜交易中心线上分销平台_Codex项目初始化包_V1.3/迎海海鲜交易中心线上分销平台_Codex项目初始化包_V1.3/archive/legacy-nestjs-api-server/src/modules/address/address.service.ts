import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Pool } from "pg";
import { DATABASE_POOL } from "../../infrastructure/database/database.provider";
import { AddressDto } from "./dto/address.dto";

@Injectable()
export class AddressService {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async list(userId: string) {
    const result = await this.pool.query(
      `
        SELECT id, receiver_name, receiver_phone, province, city, district,
               detail_address, longitude, latitude, is_default, created_at, updated_at
        FROM user_address
        WHERE user_id = $1 AND deleted_at IS NULL
        ORDER BY is_default DESC, updated_at DESC
      `,
      [userId]
    );
    return result.rows;
  }

  async create(userId: string, dto: AddressDto) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      if (dto.isDefault) {
        await client.query(
          "UPDATE user_address SET is_default = false, updated_at = now() WHERE user_id = $1",
          [userId]
        );
      }
      const result = await client.query(
        `
          INSERT INTO user_address
            (user_id, receiver_name, receiver_phone, province, city, district,
             detail_address, longitude, latitude, is_default)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
          RETURNING *
        `,
        [
          userId,
          dto.receiverName,
          dto.receiverPhone,
          dto.province,
          dto.city,
          dto.district,
          dto.detailAddress,
          dto.longitude ?? null,
          dto.latitude ?? null,
          dto.isDefault ?? false
        ]
      );
      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async update(userId: string, addressId: string, dto: AddressDto) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      if (dto.isDefault) {
        await client.query(
          "UPDATE user_address SET is_default = false, updated_at = now() WHERE user_id = $1",
          [userId]
        );
      }
      const result = await client.query(
        `
          UPDATE user_address
          SET receiver_name = $3,
              receiver_phone = $4,
              province = $5,
              city = $6,
              district = $7,
              detail_address = $8,
              longitude = $9,
              latitude = $10,
              is_default = $11,
              updated_at = now()
          WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
          RETURNING *
        `,
        [
          addressId,
          userId,
          dto.receiverName,
          dto.receiverPhone,
          dto.province,
          dto.city,
          dto.district,
          dto.detailAddress,
          dto.longitude ?? null,
          dto.latitude ?? null,
          dto.isDefault ?? false
        ]
      );
      if (!result.rows[0]) {
        throw new NotFoundException("Address not found");
      }
      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async remove(userId: string, addressId: string) {
    const result = await this.pool.query(
      `
        UPDATE user_address
        SET deleted_at = now(), is_default = false, updated_at = now()
        WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
        RETURNING id
      `,
      [addressId, userId]
    );
    if (!result.rows[0]) {
      throw new NotFoundException("Address not found");
    }
    return { id: addressId, deleted: true };
  }

  async setDefault(userId: string, addressId: string) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const exists = await client.query(
        "SELECT id FROM user_address WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL",
        [addressId, userId]
      );
      if (!exists.rows[0]) {
        throw new NotFoundException("Address not found");
      }
      await client.query(
        "UPDATE user_address SET is_default = false, updated_at = now() WHERE user_id = $1",
        [userId]
      );
      const result = await client.query(
        "UPDATE user_address SET is_default = true, updated_at = now() WHERE id = $1 RETURNING *",
        [addressId]
      );
      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
