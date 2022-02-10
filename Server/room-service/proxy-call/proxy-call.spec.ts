/* eslint-disable no-unused-expressions -- ESLint gets confused with Chai syntax*/
/* eslint-disable @typescript-eslint/no-unused-expressions -- ESLint gets confused with Chai syntax*/
import { RoomService, SocketEventCallback } from '@app/services/room-service/room-service';
import { PlayerConnection } from '@app/types/player-connection';
import { expect } from 'chai';
import * as Sinon from 'sinon';
import { ProxyCall } from './proxy-call';

describe('ProxyCall', () => {
    let decorator: (target: RoomService, propertyKey: string, _descriptor: PropertyDescriptor) => void;
    let roomServicePrototype: RoomService;

    beforeEach(() => {
        class RoomServiceStub extends RoomService {
            // eslint-disable-next-line @typescript-eslint/no-empty-function -- Empty method in stub
            method() {}

            // eslint-disable-next-line -- playerConnection unused in stub
            override initConnection(_playerConnection: PlayerConnection) {}
        }
        roomServicePrototype = RoomServiceStub.prototype;
        decorator = ProxyCall();
    });

    it('should be created', () => {
        expect(decorator).to.exist;
    });

    it('should add default socket event to class', () => {
        // eslint-disable-next-line dot-notation -- Access private property
        expect(roomServicePrototype['defaultSocketEvents']).to.be.undefined;
        decorator(roomServicePrototype, 'method', {}); // Decorate method
        // eslint-disable-next-line dot-notation -- Access private property
        expect(roomServicePrototype['defaultSocketEvents'].size).to.equal(1);
    });

    describe('socket event callback', () => {
        let returnValueAcknowledgement: Sinon.SinonSpy;

        beforeEach(async () => {
            decorator(roomServicePrototype, 'method', {}); // Decorate method
            // eslint-disable-next-line dot-notation -- Access private property
            const proxyEventCallback: SocketEventCallback = roomServicePrototype['defaultSocketEvents'].values().next().value;
            returnValueAcknowledgement = Sinon.spy();

            // Simulate a proxy call.
            await proxyEventCallback.call(roomServicePrototype, returnValueAcknowledgement);
        });

        it('should call acknowledgement function (return value to client)', () => {
            expect(returnValueAcknowledgement.called).to.be.true;
        });
    });
});
