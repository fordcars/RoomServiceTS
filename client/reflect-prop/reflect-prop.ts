/* eslint-disable @typescript-eslint/ban-types -- Can decorate any Object */
/* eslint-disable @typescript-eslint/naming-convention -- Disable naming convention for decorator*/
/*
 * ReflectProp
 * Based on https://dev.to/danywalls/using-property-decorators-in-typescript-with-a-real-example-44e
 *
 * Decorator to allow automatic reflection of server-side property in client-side proxy.
 * Must specify serverService when first used in class.
 * Must be used in conjunction with @MirrorProp on server-side.
 */

import { Injectable } from '@angular/core';
import { ServiceLocator } from '@app/services/service-locator';
import { Socket } from 'ngx-socket-io';

const SERVER_SERVICE_PROP = '$serverService$';
const lazyLoadingMap: Map<string, (...args: unknown[]) => void> = new Map();

export const ReflectProp = (serverService?: string) => {
    return <ClassType extends Object, PropType>(target: ClassType, propertyKey: string) => {
        if (serverService !== undefined) {
            Object.defineProperty(target, SERVER_SERVICE_PROP, { value: serverService });
        } else {
            serverService = target[SERVER_SERVICE_PROP as keyof ClassType] as unknown as string;
        }

        // Make sure serverService was defined at least once
        if (serverService === undefined) {
            throw new Error(`@ReflectProp: Server service for ${target.constructor.name} not found!`);
        }

        const message = `propUpdate_${serverService}_${propertyKey}`;
        let propValue: PropType; // Shared between all instances of service

        // Getter and setter will access/modify our custom value.
        const descriptor = {
            configurable: true,
            get: () => {
                return propValue;
            },

            // Allow setter to modify local value, useful for default value.
            set: (newVal: PropType) => {
                propValue = newVal;
            },
        };
        Object.defineProperty(target, propertyKey, descriptor);

        const updateCallback = (newValue: unknown) => {
            propValue = newValue as PropType;
        };

        if (ServiceLocator.injector !== undefined) {
            ServiceLocator.injector.get(Socket).on(message, updateCallback);
        } else {
            // ServiceLocator not initialized yet; setup Socket event later.
            lazyLoadingMap.set(message, updateCallback);
        }
    };
};

@Injectable()
export class ReflectPropSetup {
    constructor(private socket: Socket) {}

    // Call setupEvents() early to avoid missing any events.
    setupEvents() {
        for (const [message, callback] of lazyLoadingMap) {
            this.socket.on(message, callback);
        }

        lazyLoadingMap.clear();
    }
}
