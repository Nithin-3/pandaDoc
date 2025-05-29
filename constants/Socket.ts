import { io } from "socket.io-client";
const SOCKET_URL = "http://127.0.0.1:3030";
import AsyncStorage from "@react-native-async-storage/async-storage";
import uuid from "react-native-uuid";

const socket = io(SOCKET_URL, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 5000,
});
const init = async () => {
    try {
        let uid = await AsyncStorage.getItem("uid");

        if (!uid) {
            uid = uuid.v4();
            await AsyncStorage.setItem("uid", uid);
        }

        socket.emit("set", uid);
    } catch (error) {
        console.error("Error handling UUID:", error);
    }
};

init();
export default socket;
