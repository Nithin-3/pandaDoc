import { FileProgressProvider } from '@/components/Prog';
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import type {Routes} from './navType'
import { Platform, SafeAreaView } from 'react-native';
import Index from './index';
import Setting from './setting';
import Pdf from './pdf';
import Doc from './doc';
import List from './list';
import Chat from './chat';
import Call from './call';
const Stack = createNativeStackNavigator<Routes>();
export default function TabLayout() {

    return (
        <FileProgressProvider>
            <SafeAreaView style={{flex:1,paddingTop:Platform.OS==='android'?25:0}}>
            <Stack.Navigator >
                <Stack.Screen name="index" component={Index} options={()=>({headerShown:false})} />
                <Stack.Screen name="setting" component={Setting} options={()=>({headerShown:false})}/>
                <Stack.Screen name="pdf" component={Pdf} options={()=>({headerShown:false})} />
                <Stack.Screen name="doc" component={Doc} options={()=>({headerShown:false})} />
                <Stack.Screen name='list' component={List} options={()=>({headerShown:false})}/>
                <Stack.Screen name='chat' component={Chat} options={()=>({headerShown:false})}/>
                <Stack.Screen name='call' component={Call} options={()=>({headerShown:false})}/>
            </Stack.Navigator>
            </SafeAreaView>
        </FileProgressProvider>
    );
}
