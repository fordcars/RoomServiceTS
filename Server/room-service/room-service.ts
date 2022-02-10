import { ClientConnection } from '@app/client-connection';
import { Server } from 'socket.io';

// 'this' within the callback will be a RoomService.
export type SocketEventCallback = (this: RoomService, ...args: unknown[]) => void;

export abstract class RoomService {
    private io: Server;
    private room: string;

    // Default socket events added to all clients in this room.
    private defaultSocketEvents: Map<string, (...args: unknown[]) => void>;
    private mirroredProps: string[];

    static addDefaultSocketEventToClass(prototype: RoomService, message: string, callback: SocketEventCallback) {
        // Overwrite default value of 'defaultSocketEvents' for child type.
        if (prototype.defaultSocketEvents === undefined) {
            prototype.defaultSocketEvents = new Map();
        }

        prototype.defaultSocketEvents.set(message, callback);
    }

    static mirrorPropOfClass<PropType>(prototype: RoomService, propertyKey: string) {
        // Move the property to a different name; we are going to override the original.
        const propertyDataKey = '_mirrored_' + propertyKey;
        prototype[propertyDataKey] = prototype[propertyKey];

        // Define new getter/setter for original property
        const descriptor = {
            get(this: RoomService) {
                return this[propertyDataKey];
            },

            set(this: RoomService, newVal: PropType) {
                this[propertyDataKey] = newVal;
                this.emitPropUpdate(propertyKey);
            },
        };
        Object.defineProperty(prototype, propertyKey, descriptor);

        // Listen for request property update
        RoomService.addDefaultSocketEventToClass(
            prototype,
            prototype.getRequestPropUpdateMessage(propertyKey),
            function (this: RoomService, acknowledgement: (response: unknown) => void) {
                // eslint-disable-next-line no-invalid-this -- this is guaranteed to be a RoomService, as specified
                acknowledgement(this[propertyDataKey]);
            },
        );

        // Keep track of mirrored props for this class type
        if (prototype.mirroredProps === undefined) {
            prototype.mirroredProps = [];
        }
        prototype.mirroredProps.push(propertyKey);
    }

    // Will connect player to service in specified room
    initConnectionToRoom(io: Server, clientConnection: ClientConnection, room: string): void {
        this.io = io;
        this.room = room;

        this.initDefaultSocketEvents(clientConnection);
        this.initConnection(clientConnection);
        this.emitUpdateAllProps(clientConnection);
    }

    // Manually emit a prop update.
    // Call this when you modify a ReflectProp attribute without reassigning it!
    emitPropUpdate(propertyKey: string) {
        this.emitMessage(this.getPropUpdateMessage(propertyKey), this[propertyKey]);
    }

    protected emitMessage(message: string, ...values: unknown[]) {
        // Will only emit if service is associated to a room.
        this.io?.to(this.room).emit(message, ...values);
    }

    protected emitMessageToPlayer(clientConnection: ClientConnection, message: string, ...values: unknown[]) {
        clientConnection.socket.emit(message, ...values);
    }

    // Emit message to all players in room, except the sender
    protected emitMessageFromPlayer(clientConnection: ClientConnection, message: string, ...values: unknown[]) {
        clientConnection.socket.to(this.room).emit(message, ...values);
    }

    protected getProxyCallMessage(methodKey: string) {
        return `proxyCall_${this.constructor.name}_${methodKey}`;
    }

    protected getPropUpdateMessage(propertyKey: string) {
        return `propUpdate_${this.constructor.name}_${propertyKey}`;
    }

    protected getRequestPropUpdateMessage(propertyKey: string) {
        return `requestPropUpdate_${this.constructor.name}_${propertyKey}`;
    }

    // eslint-disable-next-line -- Empty method by default, implement to define custom socket events
    protected initConnection(_clientConnection: ClientConnection): void {}

    private initDefaultSocketEvents(clientConnection: ClientConnection) {
        if (this.defaultSocketEvents !== undefined) {
            for (const [message, callback] of this.defaultSocketEvents) {
                clientConnection.socket.on(message, callback.bind(this));
            }
        }
    }

    private emitUpdateAllProps(clientConnection: ClientConnection) {
        if (this.mirroredProps !== undefined) {
            for (const propertyKey of this.mirroredProps) {
                this.emitMessageToPlayer(clientConnection, this.getPropUpdateMessage(propertyKey), this[propertyKey]);
            }
        }
    }
}
