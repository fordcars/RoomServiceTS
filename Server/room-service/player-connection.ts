import { Socket } from 'socket.io';

export type PlayerConnection = {
    socket: Socket;
    name: string;
};
