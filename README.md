# RoomServiceTS
A simple and flexible Angular/NodeJS socket.io framework.


## Features
* Easily synchronize server-side and client-side properties.
* Call server methods from clients as if they were regular functions.
* Native support for socket.io rooms.

### Server 
* `@ProxyCall()` for methods you wish to make accessible to clients
* `@MirrorProp()` for properties that should be sychronized with clients.

### Client
* `@CallServer()` to declare a server method.
* `@ReflectProp()` to declare a mirrored server property.

Any method declared as `@ProxyCall()` on server-side and `@CallServer()` on client-side will be available to all clients. Similarly, all properties declared as `@MirrorProp()` on server-side and `@ReflectProp()` on client-side will be accessible to all clients. Please note that this relationship is unidirectional; the server **cannot** call a client-side method, and clients **cannot** modify server-side properties.

See [@MirrorProp()](#mirrorprop-details) for more details on shared properties.

## Dependencies
### Server
* NodeJS
* TypeScript
* Socket.io
* typedi (not strictly needed, but very useful)
* SinonJS and Chai (tests only)

### Client
* Angular
* ngx-socket-io
* Jasmine (tests only)

## Installation
### Server
Simply copy the `room-service` directory to your NodeJS project.

### Client
1. Copy `call-server`, `reflect-prop` and `service-locator.ts` to your Angular project.
2. Add the following to your `app.module.ts` (don't forget to modify the import paths):
```ts
// app.module.ts
import { ServiceLocator } from './service-locator';
import { ReflectPropSetup } from '@app/reflect-prop/reflect-prop';

export class AppModule {
  constructor(injector: Injector, reflectPropSetup: ReflectPropSetup) {
      ServiceLocator.injector = injector;
      reflectPropSetup.setupEvents();
  }
}
```

## Usage
### Server
1. Extend the `RoomService` base class for each class/service you wish to use RoomService with.
2. Use `@ProxyCall()` for methods you wish to make accessible to clients.
3. Use `@MirrorProp()` for properties that should be sychronized with clients.
4. Call `myService.initConnectionToRoom(socketServer: Server, connection: ClientConnection, roomName: String)` for every service within a socket.io callback (ex: `'connection'`).

Example using typedi:
```ts
// myservice.service.ts
import { Service } from 'typedi';
import { RoomService } from '@app/services/room-service/room-service';
import { MirrorProp } from '@app/services/room-service/mirror-prop/mirror-prop';
import { ProxyCall } from '@app/services/room-service/proxy-call/proxy-call';

@Service()
export class MyService extends RoomService {
  @MirrorProp() myProp: number;
  @MirrorProp() myOtherProp: boolean = false;

  constructor() {
    super();
  }

  @ProxyCall()
  myMethod(a: number, b: number): boolean {
    return a + b;
  }
  
  // Async methods supported
  @ProxyCall()
  async myAsyncMethod(query: string) {
    // Complicated database query, whatever you'd like really this is your application
    return result;
  }
}
```

```ts
// my-socket-manager.ts
import * as http from 'http';
import { Server, Socket } from 'socket.io';
import { Container, ContainerInstance } from 'typedi';

export class MySocketManager {
  private sio: Server;

  constructor(server: http.Server) {
    this.sio = new Server(server, { cors: { credentials: false, methods: ['GET', 'POST'] } });

    this.sio.on('connection', (socket: Socket) => {
      const clientConnection: ClientConnection = { socket, name: 'Client 1' };
      const container = Container.of('MyRoom');
      socket.join('MyRoom');
      
      // Call this for every service extending from RoomService
      container.get(MyService).initConnectionToRoom(this.sio, clientConnection, 'MyRoom');
    }
  }
}

```

### Client
1. Create a proxy service for every server-side `RoomService`.
2. Use `@CallServer()` to declare a server method (as async).
3. Use `@ReflectProp()` to declare a mirrored server property.

**Note: the first decorator within the proxy service must specify the server-side service name.**

```ts
import { Injectable } from '@angular/core';
import { CallServer } from '@app/decorators/call-server/call-server';
import { ReflectProp } from '@app/decorators/reflect-prop/reflect-prop';

@Injectable({
    providedIn: 'root',
})
export class MyProxyService {
  @ReflectProp('MyService') myProp: number;
  @ReflectProp() myOtherProp: boolean = false;

  @CallServer()
  async myMethod(a: number, b: number): Promise<boolean> {
    return false; // Fake return value to keep TS happy
  }

  @CallServer()
  async myAsyncMethod(query: string) {
    return '';
  }
}
```

## @MirrorProp() details
Anytime a server property declared as `@MirrorProp()` is redefined (using `=`), it will automatically update all clients. However, modifying a sub-property, array, or anything else which does not involve the property's setter will **not** trigger an update. In theses cases, the update should be triggered manually, as such:
```ts
// Server-side service
export class MyService extends RoomService {
    @MirrorProp() myArray: number[] = [];

    modifyArray(myNumber: number) {
        myArray.push(myNumber);         // Will not update clients!
        this.emitPropUpdate('myArray'); // ... so we must update clients manually
    }
}
```
