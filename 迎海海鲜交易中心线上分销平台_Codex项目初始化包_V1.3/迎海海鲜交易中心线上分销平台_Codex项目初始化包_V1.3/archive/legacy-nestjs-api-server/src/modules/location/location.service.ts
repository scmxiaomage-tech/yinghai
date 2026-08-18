import { Inject, Injectable } from "@nestjs/common";
import Redis from "ioredis";
import { REDIS_CLIENT } from "../../infrastructure/redis/redis.provider";
import { LocationDto } from "./dto/location.dto";

@Injectable()
export class LocationService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async save(userId: string, dto: LocationDto) {
    const data = {
      longitude: dto.longitude,
      latitude: dto.latitude,
      city: dto.city ?? null,
      updatedAt: new Date().toISOString()
    };
    await this.redis.set(this.key(userId), JSON.stringify(data), "EX", 60 * 60 * 24 * 30);
    return data;
  }

  async get(userId: string) {
    const value = await this.redis.get(this.key(userId));
    return value ? JSON.parse(value) : null;
  }

  private key(userId: string) {
    return `user:gps:last:${userId}`;
  }
}
