/* eslint-disable @typescript-eslint/ban-types -- Can decorate any object type */
/* eslint-disable @typescript-eslint/naming-convention -- Disable naming convention for decorator. */
/*
 * CallServer
 *
 * Decorator for calling server-side methods from client proxy.
 * Must specify serverService when first used in class.
 * Must be used in conjunction with @ProxyCall on server-side.
 */

import { ServiceLocator } from '@app/services/service-locator';
import { Socket } from 'ngx-socket-io';

const SERVER_SERVICE_PROP = '$serverService$';

export const CallServer = (serverService?: string) => {
    return <ClassType extends Object>(target: ClassType, propertyKey: string, descriptor: PropertyDescriptor) => {
        if (serverService !== undefined) {
            Object.defineProperty(target, SERVER_SERVICE_PROP, { value: serverService });
        } else {
            serverService = target[SERVER_SERVICE_PROP as keyof ClassType] as unknown as string;
        }

        // Make sure serverService was defined at least once
        if (serverService === undefined) {
            throw new Error(`@CallServer: Server service for ${target.constructor.name} not found!`);
        }
        const message = `proxyCall_${serverService}_${propertyKey}`;

        descriptor.value();
        descriptor.value = async (...args: unknown[]) => {
            return new Promise((resolve) => {
                ServiceLocator.injector.get(Socket).emit(message, ...args, (returnValue: unknown) => {
                    resolve(returnValue);
                });
            });
        };
    };
};
