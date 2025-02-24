import {Stack} from 'expo-router';

export default function TabLayout() {

  return (
        <Stack >
            <Stack.Screen name='chat' />
            <Stack.Screen name="index" />
        </Stack>
  );
}
