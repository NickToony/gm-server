import { Packet, PacketID } from "./packet";
import { Player } from "../models/player.model";

export class KickPacket extends Packet {

    constructor(player: Player, private reason = "Kicked from room.") {
        super(PacketID.Kick)
        this.player = player.id;
    }
}