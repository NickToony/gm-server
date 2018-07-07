import { Socket } from "socket.io";
import { Room } from "./room.model";
import { Packet } from "../packets/packet";
import * as net from "net";

var LAST_NUM = 0;

export class Player {
    room: Room;
    id: number;
    lastMessage = + new Date();

    websocket: Socket;
    tcpSocket: net.Socket;

    constructor() {
        this.id = LAST_NUM;
        LAST_NUM += 1;
    }

    setWebSocket(websocket: Socket) {
        this.websocket = websocket;
    }

    setTCPSocket(tcpSocket: net.Socket) {
        this.tcpSocket = tcpSocket;
        if (this.tcpSocket) {
            this.tcpSocket.setNoDelay(true);
        }
    }

    send(packet: Packet) {
        if (this.websocket) {
            this.websocket.emit("message", packet);
        } else if (this.tcpSocket) {
            this.tcpSocket.write(JSON.stringify(packet));
        }
    }

    disconnect() {
        if (this.websocket) {
            this.websocket.disconnect();
        } else if (this.tcpSocket) {
            this.tcpSocket.end();
        }
    }
}