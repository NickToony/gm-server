import { Packet, PacketID } from "./packet";

export class LeavePacket extends Packet {
    constructor() {
        super(PacketID.Leave);
    }
}