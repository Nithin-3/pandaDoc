import "@/lang/i18n"
import { ThemedText } from '@/components/ThemedText';
import * as clipbord from "expo-clipboard";
import { ThemedView } from '@/components/ThemedView';
import React, { useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, TouchableOpacity, Dimensions, Pressable, Modal, View } from 'react-native';
import {useTranslation} from 'react-i18next'
interface Contact {
    id: string;
    name: string;
    new?: number;
}

interface contProps {
    contact: Contact;
    onDeletePress?: () => void;
    onBlockPress?: () => void;
    press: () => void;
    prog: string;
    pName: string;
    blocked: boolean;
    borderColor: string;
}

const SCREEN_WIDTH = Dimensions.get('screen').width;
const SCREEN_HIGHT = Dimensions.get('window').height;

const Cont: React.FC<contProps> = ({ contact, onDeletePress, onBlockPress, prog, pName, borderColor, press, blocked }) => {
    const {t} = useTranslation();
    const [loc, sloc] = useState({ left: 0, top: 0 });
    const translateX = useRef(new Animated.Value(0)).current;
    const right = useRef(0);
    const left = useRef(0);

    const panResponder = useRef(PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 10,
        onPanResponderMove: (_, gesture) => {
            translateX.setValue(gesture.dx);
        },
        onPanResponderRelease: (_, gesture) => {
            if (gesture.dx > left.current+10) {
                slideLeft()
            } else if (gesture.dx < -(right.current+10)) {
                slideRigt()
            } else {
                resetPosition()
            }
        }
    })).current;

    const slideRigt = ()=>{
        Animated.spring(translateX, { toValue: -right.current, useNativeDriver: true }).start();
    }
    const slideLeft = ()=>{
        Animated.spring(translateX, { toValue: left.current, useNativeDriver: true }).start();
    }
    const resetPosition = () => {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
    };

    return (
        <ThemedView style={sty.root}>
            <ThemedView style={[sty.act,{backgroundColor:borderColor}]} pointerEvents='box-none'>
                <ThemedView pointerEvents='auto'>
                    <TouchableOpacity  onLayout={e=>{left.current = e.nativeEvent.layout.width}} style={[sty.actBtn, { backgroundColor: borderColor }]} onPress={() => { onBlockPress?.(); resetPosition(); }}>
                        <ThemedText style={{ fontWeight: 'bold' }} lightColor="#ECEDEE" darkColor="#000000">{t(blocked?'unblock':'block')}</ThemedText>
                    </TouchableOpacity>
                </ThemedView>
                <ThemedView pointerEvents='auto' >
                    <TouchableOpacity onLayout={e=>right.current =e.nativeEvent.layout.width} style={[sty.actBtn, { backgroundColor: borderColor }]} onPress={() => { onDeletePress?.(); resetPosition(); }}>
                        <ThemedText style={{ fontWeight: 'bold' }} lightColor="#ECEDEE" darkColor="#000000">{t('delete')}</ThemedText>
                    </TouchableOpacity>
                </ThemedView>
            </ThemedView>

            <Animated.View {...panResponder.panHandlers} style={[{ transform: [{ translateX }], zIndex: 1 }]}>
                <Pressable onPress={press} onLongPress={(e) => {
                    const { pageY,pageX } = e.nativeEvent;
                    sloc({ left:pageX, top:pageY});
                }}>
                    <ThemedView style={[sty.contItm, { borderColor }]}>
                        <ThemedText style={[sty.contNam, { textDecorationLine: blocked ? 'underline line-through' : 'none' }]}>{contact.name} {contact.new && contact.new}</ThemedText>
                        <ThemedText style={sty.contId}>{contact.id}</ThemedText>
                        {prog && (<>
                            <ThemedText type="mini">{pName}</ThemedText>
                            <ThemedView style={{ height: 3 }}>
                                <ThemedView style={{ width: `${Number(prog ?? '0')}%`, height: '100%', backgroundColor: borderColor }} />
                            </ThemedView>
                        </>)}
                    </ThemedView>
                </Pressable>
            </Animated.View>

            <Modal visible={(loc.left !== 0 && loc.top !== 0)} animationType="fade" onRequestClose={()=>sloc({left:0,top:0})} transparent>
                <TouchableOpacity style={{flex:1,position:'relative'}} onPress={()=>sloc({left:0,top:0})} activeOpacity={1}>
                    <View onLayout={e=>{
                        const {width,height} = e.nativeEvent.layout;
                        if(SCREEN_WIDTH - width < loc.left){
                            sloc(p=>({...p,left:p.left - width - 30}));
                        }
                        if(SCREEN_HIGHT - height < loc.top){
                            sloc(p=>({...p,top:p.top - height - 30}))
                        }
                    }} style={{ left: loc.left, top: loc.top, position:'absolute'} }>
                    <ThemedView style={[{borderColor},sty.pop]}>
                        <ThemedText style={{alignSelf:'center',textDecorationLine:'underline'}} type='subtitle'>{contact.name}</ThemedText>
                        <TouchableOpacity onPress={() => { clipbord.setStringAsync(contact.id); sloc({ left: 0, top: 0 }); }} style={sty.popIn}>
                            <ThemedText>{t('cp-uid')}</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { onBlockPress?.(); sloc({ left: 0, top: 0 }); }} style={sty.popIn}>
                            <ThemedText>{t(blocked?'unblock':'block')}</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { onDeletePress?.(); sloc({ left: 0, top: 0 }); }} style={sty.popIn}>
                            <ThemedText>{t('delete')}</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { onBlockPress?.(); onDeletePress?.(); sloc({ left: 0, top: 0 }); }} style={sty.popIn}>
                            <ThemedText>{t(blocked?'unblock':'block')} & {t('delete')}</ThemedText>
                        </TouchableOpacity>
                    </ThemedView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </ThemedView>
    );
};

const sty = StyleSheet.create({
    root: { flex: 1, position: 'relative',marginVertical:10 },
    contItm: { paddingHorizontal: 5, borderBottomWidth: 1 },
    contNam: { fontSize: 18, fontWeight: "bold" },
    contId: { fontSize: 14, color: "gray" },
    act: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', justifyContent: 'space-between' },
    actBtn: { height: '100%', padding: 10, alignItems: 'center', justifyContent: 'center' },
    pop: { padding: 7, borderRadius: 7, borderWidth: 1 },
    popIn: { paddingHorizontal: 7, marginVertical: 3, paddingVertical: 3 }
});

export default React.memo(Cont, (prev, next) =>
    prev.contact.id === next.contact.id &&
    prev.contact.name === next.contact.name &&
    prev.contact.new === next.contact.new &&
    prev.prog === next.prog &&
    prev.pName === next.pName &&
    prev.borderColor === next.borderColor &&
    prev.blocked === next.blocked
);

