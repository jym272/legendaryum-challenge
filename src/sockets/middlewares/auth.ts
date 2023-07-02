import { SocketIo } from '@custom-types/serverTypes';
import { getSessionStore } from '@redis/sessionStore';
import { randomId } from '@utils/functions';
import errors from '@custom-types/errors';
import { ExtendedError } from 'socket.io/dist/namespace';
const { NO_USERNAME_PROVIDED } = errors;

export async function auth(socket: SocketIo, next: (err?: ExtendedError) => void) {
  const sessionID = socket.handshake.auth.sessionID as string | undefined;
  if (sessionID) {
    const session = await getSessionStore().findSession(sessionID);
    if (session) {
      socket.data.sessionID = sessionID;
      socket.data.userID = session.userID;
      socket.data.username = session.username;
      return next();
    }
  }
  const username = socket.handshake.auth.username as string | undefined;

  if (!username) {
    return next(new Error(NO_USERNAME_PROVIDED));
  }
  socket.data.sessionID = randomId();
  socket.data.userID = randomId();
  socket.data.username = username;
  next();
}
