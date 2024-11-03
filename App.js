import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Root from './(tabs)/Root';
import Pdf from './(tabs)/Pdf'
import Cht from './(tabs)/Chat'
const stack = createStackNavigator();
export default function App() {
  return (
        <NavigationContainer>
            <stack.Navigator initialRouteName='root'>
                <stack.Screen name='root' component={Root}/>
                <stack.Screen name='pdf' component={Pdf}/>
                <stack.Screen name='Test' component={Cht}/>
            </stack.Navigator>
        </NavigationContainer>
  );
}

