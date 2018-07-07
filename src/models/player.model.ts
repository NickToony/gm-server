import { Socket } from "socket.io";
import { Room } from "./room.model";
import { Packet } from "../packets/packet";

var LAST_NUM = 0;

export class Player {
    room: Room;
    id: number;

    constructor(public socket: Socket) {
        this.id = LAST_NUM;
        LAST_NUM += 1;
    }

    send(packet: Packet) {
        this.socket.emit("message", packet);
    }
}