import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, Button, StyleSheet } from 'react-native';
import uu from 'react-native-uuid';
import Stor from '@react-native-async-storage/async-storage'
import io from 'socket.io-client';
export default function ChatApp() {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [soc,set] = useState(null);
    const [id,is] = useState('');
    async function getid (){
        let ide = await Stor.getItem('_id');
        if (!ide) {
            ide = uu.v4();
            await Stor.setItem('_id', ide);
        }
        return ide;
    }
    useEffect(()=>{
        (async ()=>{
            is(await getid());
        })();
        const sock = io(`http://192.168.246.146:3000`);
        set(sock);
        sock.emit('set','room');
        sock.on('cht',(msg)=>{
            setMessages(p=>[msg,...p]);
        })
    },[])
    const addMessage = () => {
        if (inputText.trim()) {
            const newMessage = {
                date: Date.now().toString(),
                text: inputText,
                id,
            };
            setInputText('');
            soc.emit('chat','room',newMessage);
        }
    };

    const renderMessage = ({ item }) => (
        <View style={[styles.messageContainer,item.id == id ? styles.userMessage : styles.otherMessage]}>
            <Text style={styles.messageText}>{item.text}</Text>
            <Text>{item.data}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={messages}
                keyExtractor={(item) => item.date}
                renderItem={renderMessage}
                inverted
            />
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Type a message"/>
                <Button title="Send" onPress={() => addMessage()} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: '#fff',
    },
    messageContainer: {
        maxWidth: '75%', // Limit width
        marginVertical: 5,
        padding: 10,
        borderRadius: 15,
        borderWidth: 1,
    },
    userMessage: {
        alignSelf: 'flex-end', // Align user messages to the right
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    otherMessage: {
        alignSelf: 'flex-start', // Align other messages to the left
        backgroundColor: '#E1E1E1',
        borderColor: '#ccc',
    },
    messageText: {
        color: '#fff', // White text for user messages
        fontSize: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginRight: 10,
    },
});
