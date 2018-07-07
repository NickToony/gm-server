
export enum PacketID {
    Kick = -1,
    Disconnect = -2,
    Result = -3,
    Host = -4,
    Join = -5,
    Leave = -6
}

export class Packet {
    id: number;
    player?: number;
}