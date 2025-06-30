import {NativeStackNavigationProp} from '@react-navigation/native-stack'

export type Routes = {
    index:undefined;
    list:undefined;
    chat:{
        uid: string;
        nam: string;
        block:boolean;
        blockby:boolean;
    };
    call:{
        uid:string;
        nam:string;
        cal:'IN'|'ON'|'DIA';
    };
    doc:{uri:string;};
    pdf:{uri:string;};
    setting:{forDoc?: boolean;}
};
export type listProp = NativeStackNavigationProp<Routes,'list'>;
export type chatProp = NativeStackNavigationProp<Routes,'chat'>;
export type callProp = NativeStackNavigationProp<Routes,'call'>;
export type docProp = NativeStackNavigationProp<Routes,'doc'>;
export type pdfProp = NativeStackNavigationProp<Routes,'pdf'>;
export type settingsProp = NativeStackNavigationProp<Routes,'setting'>;
export type allProp = NativeStackNavigationProp<Routes>;
