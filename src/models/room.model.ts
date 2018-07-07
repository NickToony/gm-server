import { Player } from "./player.model";
import { Packet } from "../packets/packet";
import { KickPacket } from "../packets/kick.packet";
import { HostPacket } from "../packets/host.packet";
import { HOST_MODE } from "../config";

export class Room {
    players: Player[] = [];
    host: Player = null;

    constructor(public id: string, public megaRoom = false) {

    }

    addPlayer(player: Player) {
        if (player.room != null) {
            player.room.removePlayer(player);
        }

        this.players.push(player);
        player.room = this;
        // If no current host
        if (this.host == null) {
            // Use this player
            this.setHost(player);
        }
    }

    removePlayer(player: Player) {
        player.room = null;
        var index = this.players.indexOf(player, 0);
        if (index > -1) {
           this.players.splice(index, 1);
        }

        if (this.host == player) {
            this.host = null;
            if (this.getCount() > 0) {
                this.setHost(this.players[0]);
            }
        }
      }

    send(packet: Packet, notme: Player = null) {
        // If not host mode
        if (!HOST_MODE) {
            // Send to everyone but me
            for (const otherPlayer of this.players) {
                if (otherPlayer != notme) {
                    otherPlayer.send(packet);
                }
            }
        } else {
            // If it's the host
            if (notme == this.host) {
                // Send to all but me
                for (const otherPlayer of this.players) {
                    if (otherPlayer != notme) {
                        otherPlayer.send(packet);
                    }
                }
            } else {
                // Only send to host
                this.host.send(packet);
            }
        }
    }

    kickAll(reason = "Kicked from room") {
        while (this.players.length > 0) {
            var player = this.players[0];
            this.kick(player, reason);
            this.players.splice(0, 1);
        }
    }

    kick(player: Player, reason = "Kicked from room")  {
        // Tell the player they've left
        player.send(new KickPacket(player, reason));

        // Remove them from room
        this.removePlayer(player);

        // Tell everyone else what happened
        const packet = new KickPacket(player, reason);
        packet.player = player.id;
        this.send(packet);
    }

    getCount() {
        return this.players.length;
    }

    setHost(player: Player) {
        this.host = player;
        player.send(new HostPacket);
    }
}