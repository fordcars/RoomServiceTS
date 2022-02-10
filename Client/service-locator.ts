// From https://stackoverflow.com/questions/42461852/inject-a-service-manually
import { Injector } from '@angular/core';

export class ServiceLocator {
    static injector: Injector;
}
