import React, { useState } from 'react';
import {TouchableOpacity,Modal,StyleSheet, Dimensions, ScrollView} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
type op<T>={
    label:string;
    value:T;
}
type props<T>={
    options:op<T>[];
    placeHolder?:string;
    value?:T;
    onChange?:(value:T)=>void;
}
const SCREEN_WIDTH = Dimensions.get('screen').width;
const SCREEN_HEIGHT = Dimensions.get('screen').height;
export default function Drop<T>({options,placeHolder,value,onChange}:props<T>) {
    const [selected, setSelected] = useState<T | null>(value??null);
    const [loc,sloc] = useState<{x:number,y:number}>({x:0,y:0});
    const [maxHeight,smxH] = useState(0);
    const [visible, setVisible] = useState(false);
    const borderColor=useThemeColor({light:undefined,dark:undefined},'text');
    const onSelect = (value: T) => {
        setSelected(value);
        setVisible(false);
        onChange?.(value)
    };
    return (
        <ThemedView>
            <TouchableOpacity style={[styles.dropdown,{borderColor}]}
                onPress={(e) =>{
                    const {pageX,pageY,} = e.nativeEvent;
                    sloc({x:pageX,y:pageY});
                    setVisible(true);
                }}>
                <ThemedText style={styles.dropdownText}>
                    {selected
                        ? options.find((o) => o.value === selected)?.label
                        :placeHolder}
                </ThemedText>
            </TouchableOpacity>

            <Modal transparent visible={visible} animationType="fade" onRequestClose={()=>setVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setVisible(false)} activeOpacity={1}>
                    <ScrollView style={[styles.modal,{borderColor,top:loc.y,left:loc.x,maxHeight}]} onLayout={(e)=>{
                        const {width,height} = e.nativeEvent.layout;
                        loc.x>SCREEN_WIDTH-width && sloc(p=>({x:p.x-width,y:p.y}));
                        const diff = SCREEN_HEIGHT - loc.y
                        if(loc.y < SCREEN_HEIGHT - (height + 50)){
                            smxH(diff - 50);
                        }else{
                            const up = loc.y * (1-(loc.y - SCREEN_HEIGHT * 0.6) / (SCREEN_HEIGHT*0.4));
                            smxH(SCREEN_HEIGHT - up - 50);
                            const max = Math.max(up,SCREEN_HEIGHT - height - 50)
                            sloc(p=>({...p,y:max}))
                        }}}>
                        <ThemedView>
                            {options.map((v,i)=>(
                                <TouchableOpacity key={i}
                                    style={[styles.option,{borderColor}]}
                                    onPress={() => onSelect(v.value)}>
                                    <ThemedText style={styles.optionText}>{v.label}</ThemedText>
                                </TouchableOpacity>

                            ))}
                            </ThemedView>
                    </ScrollView>
                </TouchableOpacity>
            </Modal>
        </ThemedView>
    );
}
const styles = StyleSheet.create({
    container: {marginTop: 60,paddingHorizontal: 20,},
    dropdown: {borderWidth: 1,padding: 12,borderRadius: 6,},
    dropdownText: {fontSize: 16,},
    modalOverlay: {flex: 1,position:'relative'},
    modal: {position:'absolute',borderWidth:1,borderRadius: 8,},
    option: {paddingVertical: 12,paddingHorizontal: 20,},
    optionText: {fontSize: 16,},
});

