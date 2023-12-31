import Redis from 'ioredis';
import { RoomName, RoomWithRequiredCoins } from '@custom-types/index';
import { getServerStore, getRedisClient } from '@redis/index';

export interface Session {
  userID: string;
  username: string;
  connected: boolean;
}

// TODO: test saveSession and addRoomToSession TLL
const SESSION_TTL = 24 * 60 * 60;

const mapSession = ([userID, username, connected]: (string | null)[]): Session | undefined =>
  userID && username ? { userID, username, connected: connected === 'true' } : undefined;

class SessionStore {
  private redisClient: Redis;

  constructor(redisClient: Redis) {
    this.redisClient = redisClient;
  }

  async findSession(id: string): Promise<Session | undefined> {
    const sessionData = await this.redisClient.hmget(`session:${id}`, 'userID', 'username', 'connected');
    return mapSession(sessionData);
  }

  async addRoomToSession(id: string, roomName: RoomName): Promise<void> {
    const ttlLeft = await this.redisClient.ttl(`session:${id}`);
    await this.redisClient.multi().sadd(`session:${id}:rooms`, roomName).expire(`session:${id}:rooms`, ttlLeft).exec();
  }

  async getRoomsWithCoins(id: string): Promise<RoomWithRequiredCoins[]> {
    const roomNames = await this.redisClient.smembers(`session:${id}:rooms`);
    if (roomNames.length === 0) {
      return [];
    }
    return getServerStore().getRoomsWithCoins(roomNames);
  }

  async saveSession(id: string, { userID, username, connected }: Session) {
    await this.redisClient
      .multi()
      .hset(`session:${id}`, 'userID', userID, 'username', username, 'connected', connected ? 'true' : 'false')
      .expire(`session:${id}`, SESSION_TTL)
      .exec();
  }

  async findAllSessions(): Promise<Session[]> {
    const keys = new Set<string>();
    let nextIndex = 0;
    do {
      const [nextIndexAsStr, results] = await this.redisClient.scan(nextIndex, 'MATCH', 'session:*', 'COUNT', '100');
      nextIndex = parseInt(nextIndexAsStr, 10);
      results.forEach(s => keys.add(s));
    } while (nextIndex !== 0);
    const commands: string[][] = [];
    keys.forEach(key => {
      commands.push(['hmget', key, 'userID', 'username', 'connected']);
    });
    const results = await this.redisClient.multi(commands).exec();
    if (!results) {
      return [];
    }
    return results
      .map(([err, sessionData]) => (err ? undefined : mapSession(sessionData as string[])))
      .filter(Boolean) as Session[];
  }
}

let sessionStore: SessionStore | null = null;

export const getSessionStore = () => {
  if (!sessionStore) {
    sessionStore = new SessionStore(getRedisClient().duplicate());
  }
  return sessionStore;
};
