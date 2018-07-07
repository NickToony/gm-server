## GameMaker-Server
### A simple websocket server powered by SocketIO and written in Typescript

This is a simple websocket server to quickly prototype peer-2-peer HTML games, without the need to port forward. It's originally intended to be used with GameMaker during a Game Jam, but it should work for any game engine.

**What does it do?**
Quite simply, it's a middle-man for peer-to-peer games. It accepts new connections and allows them to join "Rooms". Once in a room, any messages the client sends will be forwarded to all other clients. Thus, clients don't need to port-forward to join one another.

**What're the limitations?**
 - All game logic must be programmed on the client-side. There is no processing done server-side, so be careful of cheaters! (Note, rooms DO have a "Host", so you can still implement server-authoritative behaviour)
 - All traffic is passed through the one server. There may be a limited number of users your server can handle depending on how heavy the traffic is.

**Building**

 - `npm install`
 - `gulp build`
 - The dist folder now contains the runnable server

**Running**

 - `node dist/index.js`

### Usage
Todo