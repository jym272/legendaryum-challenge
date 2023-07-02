const errorsMessages = {
  COIN_NOT_FOUND: 'coin not found',
  COIN_NOT_AVAILABLE: 'coin already grabbed',
  INVALID_COIN_ID: 'invalid coin id',
  READING_SERVER_CONFIG_FILE: 'error reading server configuration file',
  PARSING_SERVER_CONFIG_FILE: 'error parsing server configuration file',
  INVALID_ROOM: 'invalid room provided',
  MAX_AMOUNT_COINS: 'the amount of coins is greater than the maximum number of possible coins',
  SOCKET_NOT_IN_ROOM: 'socket has not joined that room',
  ROOMS_WITH_SAME_NAME: 'there are rooms with the same name',
  ROOM_DOESNT_HAVE_COINS: "Room doesn't have coins",
  ROOM_NOT_FOUND: 'room not found',
  NO_USERNAME_PROVIDED: 'no username provided',
  SCHEMA_NOT_VALID: 'schema is not valid'
};

export default errorsMessages;
