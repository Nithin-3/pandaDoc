import { FileProgressProvider } from '@/components/Prog';
import {Stack} from 'expo-router';
import { Platform, SafeAreaView } from 'react-native';

export default function TabLayout() {

    return (
        <FileProgressProvider>
            <SafeAreaView style={{flex:1,paddingTop:Platform.OS==='android'?25:0}}>
            <Stack >
                <Stack.Screen name="index" options={()=>({headerShown:false})} />
                <Stack.Screen name="setting" options={()=>({headerShown:false})}/>
                <Stack.Screen name="pdf" options={()=>({headerShown:false})} />
                <Stack.Screen name="doc" options={()=>({headerShown:false})} />
                <Stack.Screen name='list' options={()=>({headerShown:false})}/>
                <Stack.Screen name='chating' options={()=>({headerShown:false})}/>
                <Stack.Screen name='call' options={()=>({headerShown:false})}/>
            </Stack>
            </SafeAreaView>
        </FileProgressProvider>
    );
}
