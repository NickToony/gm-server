import { Packet, PacketID } from "./packet";

export class JoinPacket extends Packet {
    constructor() {
        super(PacketID.Join);
    }

    name: string;
}