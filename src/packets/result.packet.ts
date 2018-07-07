import { Packet, PacketID } from "./packet";

export class ResultPacket extends Packet {
    constructor(public success = true, public message = "No problems") {
        super(PacketID.Result);
    }
}