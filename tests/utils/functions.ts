import { RemoteSocketData, ServerIo } from '@custom-types/serverTypes';

export const getRemoteSockets = async (socketServer: ServerIo): Promise<RemoteSocketData[]> => {
  return (await socketServer.fetchSockets()).map(socket => {
    return {
      id: socket.id,
      data: socket.data,
      rooms: [...socket.rooms]
    };
  });
};

export const createPartialDone = (count: number, done: () => void) => {
  let i = 0;
  return () => {
    if (++i === count) {
      done();
    }
  };
};
