import { Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';

export type Button = {
    txt: string;
    onPress?: () => void;
}

export type AlertProps = {
    vis: boolean;
    setVis: () => void;
    title: string;
    discription?: string;
    button: Button[];
}

export default function Alert({ vis, setVis, title, discription, button }: AlertProps) {
    const borderColor=useThemeColor({light:undefined,dark:undefined},'text');
    return (
        <Modal visible={vis} transparent onRequestClose={() => setVis()}>
            <ThemedView style={styles.overlay}>
                <ThemedView style={[styles.alertBox,{borderColor}]}>
                    <ThemedText style={styles.title}>{title}</ThemedText>
                    {discription && <ThemedText style={styles.description}>{discription}</ThemedText>}
                    <ThemedView style={styles.buttonView}>
                        {button?.map((b, index) => (<TouchableOpacity key={index} onPress={()=>{b.onPress?.();setVis()}} style={[styles.button,{borderColor}]}>
                            <ThemedText>{b.txt}</ThemedText>
                        </TouchableOpacity>))}
                    </ThemedView>
                </ThemedView>
            </ThemedView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    alertBox: {
        width: 300,
        padding: 20,
        borderRadius: 10,
        borderWidth:2,
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    description: {
        fontSize: 14,
        marginBottom: 20,
        textAlign: 'center',
    },
    button: {
        padding: 10,
        marginVertical: 5,
        borderRadius: 15,
        borderWidth:2,
        alignItems: 'center',
    },
    buttonView:{
        flexDirection:'row',
        width:"100%",
        justifyContent:'space-around',
        flexWrap:'wrap',
    }
});

