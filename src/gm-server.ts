import * as express from "express";
import * as socketIo from "socket.io";
import { createServer, Server } from "http";
import * as net from "net";
import { Packet, PacketID } from "./packets/packet";
import { Player } from "./models/player.model";
import {
  MEGA_ROOM,
  TIMEOUT,
  DEFAULT_WS_PORT,
  DEFAULT_TCP_PORT
} from "./config";
import { Room } from "./models/room.model";
import { HostPacket } from "./packets/host.packet";
import { ResultPacket } from "./packets/result.packet";
import { JoinPacket } from "./packets/join.packet";
import { DisconnectPacket } from "./packets/disconnect.packet";

export class GMServer {
  private app: express.Application;
  private players: Player[] = [];
  private rooms: Room[] = [];

  constructor() {
    // Create the app
    this.app = express();

    // Begin the websockets
    this.beginWebSocket();
    // Begin TCP socket
    this.beginTCPSocket();

    if (MEGA_ROOM) {
      this.addRoom(new Room("0", true));
    }

    this.update();
  }

  beginWebSocket(): void {
    // Create the server
    const server = createServer(this.app);

    // Grab the port
    const port = process.env.WS_PORT || DEFAULT_WS_PORT;

    // Init IO
    const io = socketIo(server);

    // Open the server on the correct port
    server.listen(port, () => {
      console.log("Running websocket server on port %s", port);
    });

    // Handle client connected
    io.on("connect", (socket: socketIo.Socket) => {
      console.log("Connected websocket client on port %s.", port);
      const player = new Player();
      player.setWebSocket(socket);
      this.addPlayer(player);

      // Handle client message
      socket.on("message", (m: Packet) => {
        const packet = m as Packet;
        this.handleMessage(player, packet);
      });

      // Handle client disconnect
      socket.on("disconnect", () => {
        console.log("Client websocket disconnected");
        player.setWebSocket(null);
        this.removePlayer(player);
      });
    });
  }

  beginTCPSocket() {
    // Grab the port
    const port = process.env.TCP_PORT || DEFAULT_TCP_PORT;

    // Create the server
    const server = net.createServer((socket) => {
      console.log("Connected TCP client on port %s.", port);
      const player = new Player();
      player.setTCPSocket(socket);
      this.addPlayer(player);

      // Handle incoming messages from clients.
      socket.on("data", (data) => {
        const packet = JSON.parse(data.toString()) as Packet;
        this.handleMessage(player, packet);
      });

      // Remove the client from the list when it leaves
      socket.on("end", () => {
        console.log("Client TCP disconnected");
        player.setTCPSocket(null);
        this.removePlayer(player);
      });
    });

    server.listen(port, () => {
      console.log("Running TCP server on port %s", port);
    });
  }

  update() {
    setTimeout(() => this.update(), 1000);

    const time = +new Date();
    for (const player of this.players) {
      if (player.lastMessage + TIMEOUT < time) {
        console.log("Player timed out, kicking.");
        this.removePlayer(player);
        break;
      }
    }
  }

  handleMessage(player: Player, packet: Packet) {
    player.lastMessage = +new Date();

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
          room.addPlayer(player);
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
            room.addPlayer(player);
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
    player.send(new DisconnectPacket());
    player.disconnect();

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
      "0123456789";

    for (var i = 0; i < 4; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }
}
