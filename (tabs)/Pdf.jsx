import React from "react";
import { SafeAreaView } from "react-native";
import PDF from "react-native-pdf";

export default function({route}) {
    return (
        <SafeAreaView style={{ flex: 1 }}>
            <PDF
                trustAllCerts={false} 
                source={{
                    uri: route.params,
                    cache: true,
                }}
                style={{ flex: 1 }}
            />
        </SafeAreaView>
  );
}

