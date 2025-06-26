import { io } from "socket.io-client";
const SOCKET_URL = "wss://pandadoc.onrender.com/";
import uuid from "react-native-uuid";
import { settingC } from "./file";

const socket = io(SOCKET_URL, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 5000,
});
const init = async () => {
    let uid = settingC.getString('uid');
    if (!uid) {
        uid = uuid.v4();
        settingC.set('uid',uid);
    }
};
init();
export default socket;
