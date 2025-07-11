import { Text, type TextProps, StyleSheet } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedTextProps = TextProps & {
    lightColor?: string;
    darkColor?: string;
    type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'mini';
};

export function ThemedText({ style, lightColor, darkColor, type = 'default', ...rest}: ThemedTextProps) {
    const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

    return (
        <Text style={[ { color },
            type === 'default' ? styles.default : undefined,
                type === 'title' ? styles.title : undefined,
                type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
                type === 'subtitle' ? styles.subtitle : undefined,
                type === 'link' ? styles.link : undefined,
                type === 'mini' ? styles.mini : undefined, style, ]} {...rest} /> );
}

const styles = StyleSheet.create({
    default: { fontSize: 15, lineHeight: 24, },
    mini:{ fontSize:10, lineHeight:18, },
    defaultSemiBold: { fontSize: 15, lineHeight: 24, fontWeight: '600', },
    title: { fontSize: 25, fontWeight: 'bold', lineHeight: 32, },
    subtitle: { fontSize: 20, fontWeight: 'bold', },
    link: { lineHeight: 30, fontSize: 15, color: 'gray', },
});
