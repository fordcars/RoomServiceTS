/*
 * ProxyCall
 * Decorator for allowing method calls from a client-side proxy.
 * Must be used in conjunction with @CallServer on client-side.
 */

import { RoomService } from '@app/services/room-service/room-service';

// eslint-disable-next-line @typescript-eslint/naming-convention -- respecting naming convention for Decorators.
export const ProxyCall = () => {
    return (target: RoomService, propertyKey: string) => {
        // eslint-disable-next-line dot-notation -- access private method
        const message = target['getProxyCallMessage'](propertyKey);

        RoomService.addDefaultSocketEventToClass(target, message, async function (this: RoomService, ...args: unknown[]) {
            // Client expects acknowledgement for return value, even if there isn't one.
            type CallbackFunction = (response: unknown) => void;
            const acknowledgement = args.pop() as CallbackFunction;

            // eslint-disable-next-line no-invalid-this -- this is guaranteed to be a RoomService, as specified
            acknowledgement(await this[propertyKey](...args));
        });
    };
};
