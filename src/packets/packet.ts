
export enum PacketID {
    Kick = -1,
    Disconnect = -2,
    Result = -3,
    Host = -4,
    Join = -5,
    Leave = -6,
    Ping = -7
}

export class Packet {
    constructor(id: number) {
        this.id = id;
    }

    id: number;
    player?: number;
}