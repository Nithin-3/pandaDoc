import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import React, { useRef, useState } from 'react';
import {Animated,PanResponder,StyleSheet,TouchableOpacity,Dimensions, Pressable} from 'react-native';
interface Contact {
    id: string;
    name: string;
    new?: number;
}
interface contProps {
    contact:Contact;
    onDeletePress?: () => void;
    onBlockPress?: () => void;
    press?: () => void;
    prog:string;
    pName:string;
    borderColor:string;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

const Cont: React.FC<contProps> = ({ contact, onDeletePress, onBlockPress, prog, pName, borderColor, press }) => {
    const [loc,sloc] = useState({left:0,top:0})
    const translateX = useRef(new Animated.Value(0)).current;
    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 10,
            onPanResponderMove: (_, gesture) => {
                translateX.setValue(gesture.dx);
            },
            onPanResponderRelease: (_, gesture) => {
                if (gesture.dx > SWIPE_THRESHOLD) {
                    Animated.spring(translateX, {
                        toValue: SCREEN_WIDTH * 0.15,
                        useNativeDriver: true,
                    }).start();
                } else if (gesture.dx < -SWIPE_THRESHOLD) {
                    Animated.spring(translateX, {
                        toValue: -SCREEN_WIDTH * 0.15,
                        useNativeDriver: true,
                    }).start();
                } else {
                    Animated.spring(translateX, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    const resetPosition = () => {
        Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
        }).start();
    };
    return (
        <ThemedView style={sty.root}>
            <ThemedView style={sty.act} pointerEvents='box-none'>
                <ThemedView pointerEvents='auto'>
                    <TouchableOpacity style={[sty.actBtn,{backgroundColor:borderColor}]} onPress={()=>{onBlockPress?.();resetPosition()}} >
                        <ThemedText style={{fontWeight:'bold'}} lightColor="#ECEDEE" darkColor="#000000">Block</ThemedText>
                    </TouchableOpacity>
                </ThemedView>
                <ThemedView pointerEvents='auto'>
                    <TouchableOpacity style={[sty.actBtn,{backgroundColor:borderColor}]} onPress={()=>{onDeletePress?.();resetPosition()}} >
                        <ThemedText style={{fontWeight:'bold'}} lightColor="#ECEDEE" darkColor="#000000">Delete</ThemedText>
                    </TouchableOpacity>
                </ThemedView>
            </ThemedView>

            <Animated.View
                {...panResponder.panHandlers}
                style={[
                    { 
                        transform: [{ translateX }],
                        zIndex:1
                    },
                ]}>
                <Pressable onPress={()=>{
                    (loc.left !== 0 && loc.top !== 0)?sloc({left:0,top:0}):press?.()
                }} onLongPress={(e)=>{
                    const {locationX,locationY} = e.nativeEvent
                    sloc({left:locationX,top:locationY*0.7})
                }}>
                <ThemedView style={[sty.contItm,{borderColor}]}>
                <ThemedText style={sty.contNam}>{contact.name} {contact.new && contact.new}</ThemedText>
                <ThemedText style={sty.contId}>{contact.id}</ThemedText>
                {prog&&(<>
                    <ThemedText type="mini">{pName}</ThemedText>
                    <ThemedView style={{height:3}}>
                        <ThemedView style={{width:`${Number(prog ?? '0')}%`,height:'100%',backgroundColor:borderColor}}/>
                    </ThemedView></>)
                    
                }
                </ThemedView>
                </Pressable>
            </Animated.View>
            {(loc.left !== 0 && loc.top !== 0)&&
            <ThemedView style={[{left:loc.left,top:loc.top,borderColor},sty.pop]}>
                <TouchableOpacity onPress={()=>{sloc({left:0,top:0})}} style={sty.popIn} ><ThemedText>Select</ThemedText></TouchableOpacity>
                <TouchableOpacity onPress={()=>{
                        onBlockPress?.();
                        sloc({left:0,top:0})
                    }} style={sty.popIn}><ThemedText>Block</ThemedText></TouchableOpacity>
                <TouchableOpacity onPress={()=>{onDeletePress?.();sloc({left:0,top:0})}} style={sty.popIn}><ThemedText>Delete</ThemedText></TouchableOpacity>
            </ThemedView>}
        </ThemedView>
    );
};

const sty = StyleSheet.create({
    root:{
        flex:1,
        position:'relative',
    },
    contItm:{
        paddingHorizontal:5,
        borderBottomWidth: 1,
    },
    contNam: { fontSize: 18, fontWeight: "bold" },
    contId: { fontSize: 14, color: "gray" },
    act:{
        ...StyleSheet.absoluteFillObject,
        flexDirection:'row',
        justifyContent:'space-between',
    },
    actBtn:{
        height:'100%',
        padding:10,
        alignItems:'center',
        justifyContent:'center'
    },
    pop:{
        position:'absolute',
        zIndex:2,
        padding:7,
        borderRadius:7,
        borderWidth:1,
    },
    popIn:{
        paddingHorizontal:7,
        marginVertical:3,
        paddingVertical:3,
    }
})
export default React.memo(Cont, (prev, next) =>
  prev.contact.id === next.contact.id &&
  prev.contact.name === next.contact.name &&
  prev.contact.new === next.contact.new &&
  prev.prog === next.prog &&
  prev.pName === next.pName &&
  prev.borderColor === next.borderColor
);
