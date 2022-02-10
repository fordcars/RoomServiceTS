/*
 * MirrorProp
 * Based on https://dev.to/danywalls/using-property-decorators-in-typescript-with-a-real-example-44e
 *
 * Decorator to allow automatic mirroring of server-side property to client-side proxy.
 * Defines getter/setter for the property. Will not automatically update clients when
 * sub properties are modified.
 * Must be used in conjunction with @ReflectProp on client-side.
 */

import { RoomService } from '@app/services/room-service/room-service';

// eslint-disable-next-line @typescript-eslint/naming-convention -- respecting naming convention for Decorators
export const MirrorProp = () => {
    return (target: RoomService, propertyKey: string) => {
        RoomService.mirrorPropOfClass(target, propertyKey);
    };
};
