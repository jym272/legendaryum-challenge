import Redis from 'ioredis';

interface Session {
  userID: string;
  username: string;
  connected: boolean;
}

abstract class SessionStore {
  abstract findSession(id: string): Promise<Session | undefined>;
  abstract saveSession(id: string, session: Session): void;
  abstract findAllSessions(): Promise<Session[]>;
}

class InMemorySessionStore extends SessionStore {
  private sessions: Map<string, Session>;

  constructor() {
    super();
    this.sessions = new Map();
  }

  findSession(id: string): Promise<Session | undefined> {
    return Promise.resolve(this.sessions.get(id));
  }

  saveSession(id: string, session: Session): void {
    this.sessions.set(id, session);
  }

  findAllSessions(): Promise<Session[]> {
    return Promise.resolve([...this.sessions.values()]);
  }
}

const SESSION_TTL = 24 * 60 * 60;

const mapSession = ([userID, username, connected]: (string | null)[]): Session | undefined =>
  userID && username ? { userID, username, connected: connected === 'true' } : undefined;

class RedisSessionStore extends SessionStore {
  private redisClient: Redis;

  constructor(redisClient: Redis) {
    super();
    this.redisClient = redisClient;
  }

  async findSession(id: string): Promise<Session | undefined> {
    const sessionData = await this.redisClient.hmget(`session:${id}`, 'userID', 'username', 'connected');
    return mapSession(sessionData);
  }

  saveSession(id: string, { userID, username, connected }: Session): void {
    void this.redisClient
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

export { InMemorySessionStore, RedisSessionStore };
