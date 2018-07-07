import { Packet, PacketID } from "./packet";

export class HostPacket extends Packet {
    constructor() {
        super(PacketID.Host);
    }

    name: string;
}