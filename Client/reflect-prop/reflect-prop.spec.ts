/* eslint-disable @typescript-eslint/ban-types -- Target can be any Object prototype*/
import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ServiceLocator } from '@app/services/service-locator';
import { Socket } from 'ngx-socket-io';
import { ReflectProp, ReflectPropSetup } from './reflect-prop';

describe('ReflectProp', () => {
    let decorator: (target: Object, propertyKey: string) => void;
    let mockPrototype: Record<'reflectedProp', string>;
    let socketSpy: jasmine.SpyObj<Socket>;

    beforeEach(() => {
        mockPrototype = class MockClass {
            reflectedProp: string;
        }.prototype;

        decorator = ReflectProp('MockClass');
        socketSpy = jasmine.createSpyObj('Socket', ['on']);
        ServiceLocator.injector = {
            get: () => {
                return socketSpy;
            },
        };
    });

    it('should be created', () => {
        expect(decorator).toBeTruthy();
    });

    describe('decorated property', () => {
        beforeEach(() => {
            // Decorate property
            decorator(mockPrototype, 'reflectedProp');
        });

        it('should define serverService', () => {
            expect(mockPrototype['$serverService$' as keyof typeof mockPrototype]).toEqual('MockClass');
        });

        it('should use same serverService as previous @ReflectProp', () => {
            ReflectProp()(mockPrototype, 'reflectedProp');
            expect(mockPrototype['$serverService$' as keyof typeof mockPrototype]).toEqual('MockClass');
        });

        it('should set socket event', () => {
            expect(socketSpy.on).toHaveBeenCalledWith('propUpdate_MockClass_reflectedProp', jasmine.any(Function));
        });

        it('should update property on socket event', () => {
            const callback = socketSpy.on.calls.argsFor(0)[1];
            callback('test');
            expect(mockPrototype.reflectedProp).toEqual('test');
        });
    });

    it('should throw if serverService is never defined', () => {
        expect(() => {
            ReflectProp()(mockPrototype, 'reflectedProp');
        }).toThrow();
    });
});

describe('ReflectPropSetup', () => {
    let service: ReflectPropSetup;
    let socketSpy: jasmine.SpyObj<Socket>;

    beforeEach(() => {
        socketSpy = jasmine.createSpyObj('Socket', ['on']);

        ServiceLocator.injector = undefined as unknown as Injector;
        ReflectProp('MockClass')({ reflectedProp: 'Test' }, 'reflectedProp');

        TestBed.configureTestingModule({
            providers: [{ provide: ReflectPropSetup }, { provide: Socket, useValue: socketSpy }],
        });
        service = TestBed.inject(ReflectPropSetup);
    });

    it('should set socket event', () => {
        service.setupEvents();
        expect(socketSpy.on).toHaveBeenCalled();
    });
});
