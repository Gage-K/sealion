import { randomUUID } from "crypto";

/**
 * Room manager handles the creation and management of rooms and clients
 */
export class RoomManager {
  private readonly id: string;
  private clients: Client[];
  // TODO: do we need some kind heartbeat (ping/pong — check if client is still connected)

  constructor() {
    this.id = randomUUID();
    this.clients = [];
    this.createRoom();
  }

  createRoom() {}

  getRoomId() {
    return this.id;
  }

  getClients(): Client[] {
    return this.clients;
  }

  getClientById(id: string): Client | null {
    return this.clients.find((client) => client.id === id) || null;
  }

  addClient(client: Client): void {
    this.clients.push(client);

    const { id } = client;
    // TODO: this should update the list of clients in the room and give them any necessary metadata
  }

  removeClient(client: Client): void {
    // TODO: filter out the client from the list of clients based on id
  }
}

export type Client = {
  id: string;
};

// // This is what comes in from the WebSocket payload
// export interface WSData {
//   roomId: string;
//   // Username should be the "user" field in the CRDT
//   username: string;
//   // Client id is used to have a unique identity for each client for the server
//   clientId: string = `${roomId}-${username}`
// }

/*

Lets make sure the client, the request, and the server all have their own data that is separate from each other but related.

- user opens form for entering a room
- they set their username
- they enter the room id & click join
- this will send a payload to the server
- payload will contain their name (username) 
*/
