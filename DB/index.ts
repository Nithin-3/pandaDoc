import SqAdapt from '@nozbe/watermelondb/adapters/sqlite';
import {Database,Q} from '@nozbe/watermelondb';
import {schema} from './schema';
import Chat from './chat';
import Contacts from './contact';
import { Subscription } from 'rxjs';
import { settingC } from '@/constants/file';
const adapter = new SqAdapt({schema});
const database = new Database({adapter,modelClasses:[Chat,Contacts]})

export type ChatMessage = {
    msg?: string;
    uri?:string;
    uid:string;
    time:number;
    who: string;
};
export type Contact = {
    uid: string;
    name: string;
    new?: number;
    at:number;
}

export function watch(...args: [table: 'chat', uid:string, callback: (rows: ChatMessage[]) => void] | [table: 'contact', callback: (rows: Contact[]) => void]): Subscription {
    if(args[0] == 'contact'){
        return database.get(args[0]).query(Q.sortBy('new','desc'),Q.sortBy('at','desc')).observe().subscribe(rows=>{args[1](rows.map(model=>({
            // @ts-ignore
            name : model.name,
            // @ts-ignore
            uid : model.uid,
            // @ts-ignore
            new : model.new,
            // @ts-ignore
            at : model.at,
        } satisfies Contact)))})
    }
    return database.get(args[0]).query(Q.where('uid',args[1]), Q.where('time',Q.gt(settingC.getNumber(args[1])??0)), Q.sortBy('time')).observe().subscribe(rows=>{args[2](rows.map(model=>({
        // @ts-ignore
        msg : model.msg,
        // @ts-ignore
        uri : model.uri,
        // @ts-ignore
        time : model.time,
        // @ts-ignore
        who : model.who,
        // @ts-ignore
        uid : model.uid,
    } satisfies ChatMessage)))})

}

export function cat(table: 'chat', foreignKey: number, uid:string, past?: boolean): Promise<ChatMessage[]>;
export function cat(table: 'contact', foreignKey?: string): Promise<Contact[]>;
export async function cat(table: 'chat' | "contact", foreignKey?: string | number, uid?:string, past=true):Promise<ChatMessage[] | Contact[]>{
    if("chat" == table) return (await database.get(table).query(Q.where('uid',uid!), Q.where('time', past ? Q.lt(foreignKey!) : Q.gt(foreignKey!)), Q.sortBy('time'), Q.take(50)).fetch()).map(v=>({
        // @ts-ignore
        msg:v.msg,
        // @ts-ignore
        uri:v.uri,
        // @ts-ignore
        uid: v.uid,
        // @ts-ignore
        time: v.time,
        // @ts-ignore
        who: v.who
    } satisfies ChatMessage))
    if(!foreignKey) return (await database.get(table).query(Q.sortBy('new','desc'), Q.sortBy('at','desc')).fetch()).map(model => ({
        // @ts-ignore
        uid: model.uid,
        // @ts-ignore
        name: model.name,
        // @ts-ignore
        new: model.new,
        // @ts-ignore
        at: model.at
    } satisfies Contact))
    return (await database.get(table).query(Q.where('uid',foreignKey)).fetch()).map(model => ({
        // @ts-ignore
        uid: model.uid,
        // @ts-ignore
        name: model.name,
        // @ts-ignore
        new: model.new,
        // @ts-ignore
        at: model.at
    } satisfies Contact))
}

export function touch(table:'chat',data:ChatMessage|ChatMessage[]):Promise<void>;
export function touch(table:'contact',data:Contact|Contact[]):Promise<void>;
export async function touch(table:'chat'|'contact',data:ChatMessage|ChatMessage[]|Contact|Contact[]):Promise<void>{
    const collection = database.get(table);
    const item = Array.isArray(data) ? data : [data];
    await database.write(async ()=>{
        await Promise.all(item.map(row=>collection.create(rec=>{
            Object.entries(row).forEach(([key,val])=>{
                // @ts-ignore
                rec[key] = val;
            })
        })))
    })

}

export function echo(table: "chat", foreignKey: number, update:Partial<ChatMessage>):Promise<void>;
export function echo(table: "contact", foreignKey: string, update:Partial<Contact>):Promise<void>;
export async function echo(table: "chat" | "contact", foreignKey:number|string, update: Partial<ChatMessage> | Partial<Contact> ):Promise<void>{
    const collection = database.get(table);
    const [rec] = await collection.query(Q.where( 'chat' == table ? 'time' : 'uid', foreignKey )).fetch()
    if(!rec) return;
    await database.write(async ()=>{
        await rec.update(r=>{
            Object.entries(update).forEach(([key,val])=>{
                // @ts-ignore
                r[key] = val;
            })
        })
    })

}

export function rm(table:'chat', foreignKey:number|string):Promise<void>;
export function rm(table:'contact', foreignKey:string):Promise<void>;
export async function rm(table:'chat'|'contact', foreignKey:number|string):Promise<void>{
    const collection = database.get(table);
    const [rec] = await collection.query(Q.where( 'number' == typeof foreignKey ? 'time' : 'uid', foreignKey )).fetch()
    if(!rec) return;
    await database.write(async ()=>{
        await rec.destroyPermanently();
    })
}
