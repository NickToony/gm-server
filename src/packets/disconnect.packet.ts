import { Packet, PacketID } from "./packet";

export class DisconnectPacket extends Packet {
    constructor() {
        super(PacketID.Disconnect);
    }
}