/* eslint-disable @typescript-eslint/no-explicit-any -- Make constructor constructible*/
/* eslint-disable @typescript-eslint/ban-types -- Target can be any Object prototype */
import { ServiceLocator } from '@app/services/service-locator';
import { Socket } from 'ngx-socket-io';
import { CallServer } from './call-server';

describe('CallServer', () => {
    let decorator: (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => void;
    let mockPrototype: Record<'serverMethod', () => Promise<string>>;
    let socketSpy: jasmine.SpyObj<Socket>;

    beforeEach(() => {
        mockPrototype = class MockClass {
            async serverMethod() {
                return 'originalValue';
            }
        }.prototype;

        decorator = CallServer('MockClass');
        socketSpy = jasmine.createSpyObj('Socket', ['emit']);
        // Send mock acknowledgement
        socketSpy.emit.and.callFake((msg: string, acknowledgement: (value: unknown) => void) => {
            acknowledgement('serverValue');
        });
        ServiceLocator.injector = {
            get: () => {
                return socketSpy;
            },
        };
    });

    it('should be created', () => {
        expect(decorator).toBeTruthy();
    });

    describe('decorated method', () => {
        let decoratedInstance: typeof mockPrototype;

        beforeEach(() => {
            const descriptor = Object.getOwnPropertyDescriptor(mockPrototype, 'serverMethod') as PropertyDescriptor;
            decorator(mockPrototype, 'serverMethod', descriptor);
            Object.defineProperty(mockPrototype, 'serverMethod', descriptor);

            decoratedInstance = new (mockPrototype.constructor as any)();
        });

        it('should define serverService', () => {
            expect(mockPrototype['$serverService$' as keyof typeof mockPrototype]).toEqual('MockClass');
        });

        it('should use same serverService as previous @ReflectProp', () => {
            const descriptor = Object.getOwnPropertyDescriptor(mockPrototype, 'serverMethod') as PropertyDescriptor;
            CallServer()(mockPrototype, 'reflectedProp', descriptor);
            expect(mockPrototype['$serverService$' as keyof typeof mockPrototype]).toEqual('MockClass');
        });

        it('should call server', async () => {
            const expectedMessage = 'proxyCall_MockClass_serverMethod';
            await decoratedInstance.serverMethod();
            expect(socketSpy.emit).toHaveBeenCalledWith(expectedMessage, jasmine.any(Function));
        });

        it('should return value from server', async () => {
            const returnedValue = await decoratedInstance.serverMethod();
            expect(returnedValue).toEqual('serverValue');
        });
    });

    it('should throw if serverService is never defined', () => {
        const descriptor = Object.getOwnPropertyDescriptor(mockPrototype, 'serverMethod') as PropertyDescriptor;
        expect(() => {
            CallServer()(mockPrototype, 'serverMethod', descriptor);
        }).toThrow();
    });
});
