/* eslint-disable no-unused-expressions -- ESLint gets confused with Chai syntax*/
/* eslint-disable @typescript-eslint/no-unused-expressions -- ESLint gets confused with Chai syntax*/
import { RoomService } from '@app/services/room-service/room-service';
import { expect } from 'chai';
import { MirrorProp } from './mirror-prop';

describe('MirrorProp', () => {
    let decorator: (target: RoomService, propertyKey: string, _descriptor: PropertyDescriptor) => void;

    beforeEach(() => {
        decorator = MirrorProp();
    });

    it('should be created', () => {
        expect(decorator).to.exist;
    });
});
