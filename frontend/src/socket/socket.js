import SockJS from "sockjs-client/dist/sockjs";
import { Client } from "@stomp/stompjs";

const socket = new Client({
  webSocketFactory: () => new SockJS(import.meta.env.VITE_WS_URL),

  reconnectDelay: 5000,
});

export default socket;
