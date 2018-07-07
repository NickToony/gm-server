import * as express from "express";
import * as socketIo from "socket.io";
import { createServer, Server } from "http";
import { Packet, PacketID } from "./packets/packet";
import { Player } from "./models/player.model";
import { DEFAULT_PORT, MEGA_ROOM } from "./config";
import { Room } from "./models/room.model";
import { HostPacket } from "./packets/host.packet";
import { ResultPacket } from "./packets/result.packet";
import { JoinPacket } from "./packets/join.packet";

export class GMServer {
  private app: express.Application;
  private server: Server;
  private io: SocketIO.Server;
  private port: string | number;
  private players: Player[] = [];
  private rooms: Room[] = [];

  constructor() {
    // Create the app
    this.app = express();
    // Create the server
    this.server = createServer(this.app);
    // Init IO
    this.io = socketIo(this.server);
    // Grab the port
    this.port = process.env.PORT || DEFAULT_PORT;

    this.begin();

    if (MEGA_ROOM) {
      this.addRoom(new Room("0", true));
    }
  }

  begin(): void {
    // Open the server on the correct port
    this.server.listen(this.port, () => {
      console.log("Running server on port %s", this.port);
    });

    // Handle client connected
    this.io.on("connect", (socket: any) => {
      console.log("Connected client on port %s.", this.port);
      const player = new Player(socket);
      this.addPlayer(player);

      // Handle client message
      socket.on("message", (m: Packet) => {
        const packet = m as Packet;
        this.handleMessage(player, packet);
      });

      // Handle client disconnect
      socket.on("disconnect", () => {
        console.log("Client disconnected");
        this.removePlayer(player);
      });
    });
  }

  handleMessage(player: Player, packet: Packet) {
    
    switch (packet.id) {
      case PacketID.Disconnect:
        this.removePlayer(player);
        break;

      case PacketID.Host:
        // Read the name
        var name = (packet as HostPacket).name;

        // Generate random name if needed
        if (name == null || name == "") {
          name = this.generateName();
        }

        // Check it doesn't clash
        var valid = true;
        for (const room of this.rooms) {
          if (room.id == name) {
            valid = false;
          }
        }
        // If it's valid
        if (valid) {
          // Make the room
          var room = new Room(name);
          this.addRoom(room);
          // Set the player to that room
          player.room = room;
          room.host = player;
          // Tell them the good news
          player.send(new ResultPacket(true, "Room created and joined."));
        } else {
          // Failure :(
          player.send(
            new ResultPacket(false, "Room could not be created with that name.")
          );
        }
        break;

      case PacketID.Join:
        // Read the name
        var name = (packet as JoinPacket).name;

        for (const room of this.rooms) {
          if (room.id == name) {
            player.room = room;
            player.send(new ResultPacket(true, "Join room"));
            break;
          }
        }
        break;

      case PacketID.Leave:
        if (player.room != null) {
          player.room.kick(player, "Leaving room");
          player.room = null;
        }
        break;

      default:
        packet.id = player.id;
        if (player.room != null) {
          player.room.send(packet, player);
        }
        break;
    }
  }

  addPlayer(player: Player) {
    this.players.push(player);
  }

  removePlayer(player: Player) {
    player.socket.disconnect();

    if (player.room != null) {
      player.room.removePlayer(player);

      if (!player.room.megaRoom && player.room.getCount() <= 0) {
        this.removeRoom(player.room);
      }
    }

    var index = this.players.indexOf(player, 0);
    if (index > -1) {
      this.players.splice(index, 1);
    }
  }

  addRoom(room: Room) {
    this.rooms.push(room);
  }

  removeRoom(room: Room) {
    room.kickAll("Room closed");

    var index = this.rooms.indexOf(room, 0);
    if (index > -1) {
      this.rooms.splice(index, 1);
    }
  }

  getCount() {
    return this.players.length;
  }

  public getApp() {
    return this.app;
  }

  generateName() {
    var valid = false;
    var name;
    while (!valid) {
      valid = true;
      name = this.makeid();
      for (const room of this.rooms) {
        if (room.id == name) {
          valid = false;
        }
      }
    }
    return name;
  }

  makeid() {
    var text = "";
    var possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 4; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }
}
