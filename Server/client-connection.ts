import { Socket } from 'socket.io';

export type ClientConnection = {
    socket: Socket;
    name: string;
};
