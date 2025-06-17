import { io } from "socket.io-client";
const SOCKET_URL = "wss://pandadoc.onrender.com/";
import AsyncStorage from "@react-native-async-storage/async-storage";
import uuid from "react-native-uuid";

const socket = io(SOCKET_URL, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 5000,
});
export const init = async () => {
    let uid = await AsyncStorage.getItem("uid");
    if (!uid) {
        uid = uuid.v4();
        await AsyncStorage.setItem("uid", uid);
    }
    socket.emit("set", uid);
};

export default socket;
