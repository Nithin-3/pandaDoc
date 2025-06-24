import React, { useState } from 'react';
import {TouchableOpacity,Modal,FlatList,StyleSheet, View, Dimensions, ScrollView} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
type op={
    label:string;
    value:any;
}

const SCREEN_WIDTH = Dimensions.get('screen').width;
const SCREEN_HEIGHT = Dimensions.get('screen').height;
export default function Drop({options,placeHolder,onChange}:{options:op[],placeHolder?:string,onChange?:(value:any)=>void;}) {
    const [selected, setSelected] = useState<string | null>(null);
    const [loc,sloc] = useState<{x:number,y:number}>({x:0,y:0});
    const [maxHeight,smxH] = useState(0);
    const [visible, setVisible] = useState(false);
    const borderColor=useThemeColor({light:undefined,dark:undefined},'text');
    const onSelect = (value: string) => {
        setSelected(value);
        setVisible(false);
        onChange?.(value)
    };

    return (
        <ThemedView>
            <TouchableOpacity style={[styles.dropdown,{borderColor}]}
                onPress={(e) =>{
                    const {pageX,pageY} = e.nativeEvent;
                    sloc({x:pageX,y:pageY});
                    setVisible(true);
                }}>
                <ThemedText style={styles.dropdownText}>
                    {selected
                        ? options.find((o) => o.value === selected)?.label
                        :placeHolder}
                </ThemedText>
            </TouchableOpacity>

            <Modal transparent visible={visible} animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    onPress={() => setVisible(false)}
                    activeOpacity={1}
                >
                    <ScrollView style={[styles.modal,{borderColor,top:loc.y,left:loc.x,maxHeight}]} onLayout={(e)=>{
                        const {width,height} = e.nativeEvent.layout;
                        loc.x>SCREEN_WIDTH-width && sloc(p=>({x:p.x-width,y:p.y}));
                        SCREEN_HEIGHT-loc.y>height ? smxH(SCREEN_HEIGHT-loc.y-50):smxH(height)
                    }}>
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
    container: {
        marginTop: 60,
        paddingHorizontal: 20,
    },
    dropdown: {
        borderWidth: 1,
        padding: 12,
        borderRadius: 6,
    },
    dropdownText: {
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        position:'relative'
    },
    modal: {
        position:'absolute',
        borderWidth:1,
        borderRadius: 8,
    },
    option: {
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    optionText: {
        fontSize: 16,
    },
});

