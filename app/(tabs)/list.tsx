import React, { useState, useEffect } from "react";
import { FlatList, TouchableOpacity, StyleSheet, Modal, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import uuid from "react-native-uuid";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ThemedInput } from "@/components/ThemedInput";
import { GestureHandlerRootView, Swipeable } from "react-native-gesture-handler";
import * as clipbord from "expo-clipboard";
import {useNavigation} from 'expo-router'
import * as FileSystem from 'expo-file-system';
import socket from '@/constants/Socket';
const CONTACTS_KEY = "chat_contacts";

const ChatContactsScreen = () => {
    const [contacts, setContacts] = useState([]);
    const [name, sname] = useState("");
    const [uid, suid] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [yar,syar] = useState("");
    const nav = useNavigation()
    useEffect(() => {
      contacts.length &&
        await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
    }, [contacts])
    
    useEffect(() => {
        socket.on('msg', async (msg) => {
            try {
                const path = `${FileSystem.documentDirectory}${msg.yar}.nin`;
                const fileInfo = await FileSystem.getInfoAsync(path);
                if (!fileInfo.exists) {
                    suid(msg.yar);
                    sname('unknown');
                    addContact();
                    await FileSystem.writeAsStringAsync(path, JSON.stringify([msg]), { encoding: FileSystem.EncodingType.UTF8 });
                    return;
                }
                const oldData = await FileSystem.readAsStringAsync(path, { encoding: FileSystem.EncodingType.UTF8 });
                const parsedData = JSON.parse(oldData);
                await FileSystem.writeAsStringAsync(path, JSON.stringify([...parsedData, msg]), { encoding: FileSystem.EncodingType.UTF8 });
                setContacts(moveToFirst(contacts,msg.yar));
            } catch (error) {
                console.error('Error handling file:', error);
            }
        });
        loadContacts();
        return ()=>{
            socket.off("msg")
        }
    }, []);

    function moveToFirst(arr, targetId) {
        const index = arr.findIndex(item => item.id === targetId);
        if (index > -1) {
            const [item] = arr.splice(index, 1);
            arr.unshift({...item,new:item.new?item.new+1:1});
        }
        return arr;
    }

    const loadContacts = async () => {
        try {
            const storedContacts = await AsyncStorage.getItem(CONTACTS_KEY);
            syar(await AsyncStorage.getItem('uid'));
            if (storedContacts) {
                setContacts(JSON.parse(storedContacts));
            }
        } catch (error) {
            console.error("Error loading contacts:", error);
        }
    };
    const addContact = async () => {
        if (!name.trim()) return;
        const index = contacts.findIndex(item => item.id === uid);
        if(-1 < index){

            Alert.alert(
                `uid alredy exist in ${contacts[index].name}`,
                "Are you sure you want to rewrite this contact?",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "ok", style: "destructive", onPress: () => setContacts(p=>p.map(i=>i.id===uid?{...i,name:name.trim()}:i))},
                ]
            );
            return;
        }
        const newContact = {
            id: uid ,
            name: name.trim(),
        };
        const updatedContacts = [...contacts, newContact];
        setContacts(updatedContacts);

        sname("");
        suid("");
        setModalVisible(false);
    };
    const deleteContact = async (contactId) => {
        const updatedContacts = contacts.filter((contact) => contact.id !== contactId);
        setContacts(updatedContacts);
    };
    const showDeleteAlert = (contactId) => {
        Alert.alert(
            "Delete Contact",
            "Are you sure you want to delete this contact?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => deleteContact(contactId) },
            ]
        );
    };
    const renderSwipeableContact = ({ item }) => (
        <Swipeable
            renderRightActions={() => (
                <TouchableOpacity style={styles.deleteButton} onPress={() => showDeleteAlert(item.id)}>
                    <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>
                </TouchableOpacity>
            )}
        >
            <TouchableOpacity onPress={()=>{nav.navigate('chat',{uid:item.id})}} onLongPress={() => showDeleteAlert(item.id)} style={styles.contactItem}>
                <ThemedText style={styles.contactName}>{item.name}</ThemedText>
                <ThemedText style={styles.contactUuid}>{item.id}</ThemedText>
                <ThemedText>{item.new}</ThemedText>
            </TouchableOpacity>
        </Swipeable>
    );

    return (
        <GestureHandlerRootView style={styles.container}>
            <ThemedView style={styles.container}>
                <TouchableOpacity onLongPress={()=>{clipbord.setStringAsync(yar)}}>
                <ThemedText>{yar}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
                    <ThemedText style={styles.addButtonText}>Add Contact</ThemedText>
                </TouchableOpacity>

                <FlatList
                    data={contacts}
                    keyExtractor={(item) => item.id}
                    renderItem={renderSwipeableContact}
                />

                <Modal visible={modalVisible} animationType="slide" transparent>
                    <ThemedView style={styles.modalContainer}>
                        <ThemedView style={styles.modalContent}>
                            <ThemedText style={styles.modalTitle}>Add Contact</ThemedText>

                            <ThemedInput
                                placeholder="Enter contact name"
                                value={name}
                                onChangeText={sname}
                            />

                            <ThemedInput
                                placeholder="Enter UUID"
                                value={uid}
                                onChangeText={suid}
                            />

                            <ThemedView style={styles.modalButtons}>
                                <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
                                    <ThemedText style={styles.modalButtonText}>Cancel</ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.modalButton} onPress={addContact}>
                                    <ThemedText style={styles.modalButtonText}>Save</ThemedText>
                                </TouchableOpacity>
                            </ThemedView>
                        </ThemedView>
                    </ThemedView>
                </Modal>
            </ThemedView>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1,},
    addButton: {
        padding: 12,
        borderRadius: 5,
        alignItems: "center",
        marginBottom: 20,
    },
    addButtonText: {fontSize: 16, fontWeight: "bold" },
    contactItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
    },
    contactName: { fontSize: 18, fontWeight: "bold" },
    contactUuid: { fontSize: 14, color: "gray" },
    deleteButton: {
        backgroundColor: "red",
        justifyContent: "center",
        alignItems: "center",
        width: 80,
        marginVertical: 5,
    },
    deleteButtonText: { color: "white", fontWeight: "bold" },
    modalContainer: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        width: "80%",
        padding: 20,
        borderRadius: 10,
    },
    modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 15,
    },
    modalButton: {
        padding: 10,
        borderRadius: 5,
        flex: 1,
        alignItems: "center",
        marginHorizontal: 5,
    },
    modalButtonText: { color: "white", fontWeight: "bold" },
});

export default ChatContactsScreen;

