import { useEffect } from 'react';
import { StyleSheet, ScrollView,PermissionsAndroid } from 'react-native';
import {useNavigation} from 'expo-router'
export default function HomeScreen() {
    const nav = useNavigation()
    useEffect(()=>{
        nav.navigate("chat");
        
    },[])
    const getfile = async ()=>{
        try{
        }catch{
            console.log("adda")
        }
    }
    getfile()
    return (
        <ScrollView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    stepContainer: {
        gap: 8,
        marginBottom: 8,
    },
    reactLogo: {
        height: 20,
        width: 200,
        bottom: 0,
        left: 0,
        position: 'absolute',
    },
});
