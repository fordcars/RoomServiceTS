/* eslint-disable no-unused-expressions -- ESLint gets confused with Chai syntax.*/
/* eslint-disable @typescript-eslint/no-unused-expressions -- ESLint gets confused with Chai syntax.*/
import { PlayerConnection } from '@app/types/player-connection';
import { expect } from 'chai';
import * as Sinon from 'sinon';
import { Server, Socket } from 'socket.io';
import { RoomService } from './room-service';

class RoomServiceStub extends RoomService {
    test: string = '123';
}

describe('RoomService', () => {
    let roomService: RoomService;
    let serverStub: Sinon.SinonStubbedInstance<Server>;
    let emitSpy: Sinon.SinonSpy;

    beforeEach(() => {
        // Create concrete RoomService
        roomService = new RoomServiceStub();

        // Setup server stub
        emitSpy = Sinon.spy();
        serverStub = Sinon.createStubInstance(Server);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Fake emit method
        serverStub.to.returns({ emit: emitSpy } as any);

        // eslint-disable-next-line dot-notation -- Set private property manually
        roomService['io'] = serverStub as unknown as Server;
    });

    it('should be created', () => {
        expect(roomService).to.exist;
    });

    it('should add default socket to class', () => {
        // eslint-disable-next-line dot-notation -- Access private property
        expect(roomService['defaultSocketEvents']).to.be.undefined;
        // eslint-disable-next-line @typescript-eslint/no-empty-function -- Give empty event callback
        RoomService.addDefaultSocketEventToClass(roomService, 'test', () => {});
        // eslint-disable-next-line dot-notation -- Access private property
        expect(roomService['defaultSocketEvents'].size).to.equal(1);
    });

    describe('mirrorPropOfClass', () => {
        it('should add prop to mirrored props', () => {
            // eslint-disable-next-line dot-notation -- Access private property
            expect(roomService['mirroredProps']).to.be.undefined;
            RoomService.mirrorPropOfClass(roomService, 'test');
            // eslint-disable-next-line dot-notation -- Access private property
            expect(roomService['mirroredProps'].length).to.equal(1);
        });

        it('should return value in acknowledgement when prop update requested', () => {
            // eslint-disable-next-line dot-notation -- Access private property
            expect(roomService['defaultSocketEvents']).to.be.undefined;
            RoomService.mirrorPropOfClass(roomService, 'test');

            // eslint-disable-next-line dot-notation -- Access private property
            const propUpdateCallback = roomService['defaultSocketEvents'].values().next().value;
            const acknowledgementSpy = Sinon.spy();
            propUpdateCallback.call(roomService, acknowledgementSpy);
            expect(acknowledgementSpy.calledWith('123')).to.be.true;
        });
    });

    it('should init connection for playerConnection', () => {
        const mockPlayerConnection: PlayerConnection = { name: 'John', socket: Sinon.createStubInstance(Socket) as unknown as Socket };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Spy on private method
        const initConnectionSpy = Sinon.spy(roomService as any, 'initConnection');
        roomService.initConnectionToRoom(Sinon.createStubInstance(Server) as unknown as Server, mockPlayerConnection, 'room');
        expect(initConnectionSpy.called).to.be.true;
    });

    it('should emit prop update', () => {
        roomService.emitPropUpdate('test');
        expect(emitSpy.calledWith('propUpdate_RoomServiceStub_test')).to.be.true;
    });

    it('should not emit message if server is undefined', () => {
        // eslint-disable-next-line dot-notation -- Test private property
        roomService['io'] = undefined as unknown as Server;
        // eslint-disable-next-line dot-notation -- Test protected method
        roomService['emitMessage']('msg');
        expect(emitSpy.called).to.be.false;
    });

    it('should emit message from player', () => {
        const playerEmitSpy = Sinon.spy();
        const socketStub = Sinon.createStubInstance(Socket);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Fake emit method
        socketStub.to.returns({ emit: playerEmitSpy } as any);
        const playerConnection: PlayerConnection = { name: 'John', socket: socketStub as unknown as Socket };

        // eslint-disable-next-line dot-notation -- Test protected method
        roomService['emitMessageFromPlayer'](playerConnection, 'msg');
        expect(playerEmitSpy.calledWith('msg')).to.be.true;
    });
});
