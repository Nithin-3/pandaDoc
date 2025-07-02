import SqAdapt from '@nozbe/watermelondb/adapters/sqlite';
import {Database,Q,Model} from '@nozbe/watermelondb';
import {schema} from './schema';
import Chat from './chat';
import Contacts from './contact';
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
    id: string;
    name: string;
    new?: number;
    at:number;
}
export function cat(table: 'chat', foreignKey: number, past?: boolean): Promise<Model[]>;
export function cat(table: 'contact', foreignKey?: string): Promise<Model[]>;
export async function cat(table: 'chat' | "contact", foreignKey?: string | number, past=true):Promise<Model[]>{
    if("chat" == table) return await database.get(table).query(Q.where('time', past ? Q.lt(foreignKey!) : Q.gt(foreignKey!)), Q.sortBy('time'), Q.take(50)).fetch()
    if(!foreignKey) return await database.get(table).query(Q.sortBy('new','desc'), Q.sortBy('at','desc')).fetch();
    return await database.get(table).query(Q.where('uid',foreignKey)).fetch();
}

export function touch(table:'chat',data:ChatMessage|ChatMessage[]):Promise<void>;
export function touch(table:'contact',data:Contact|Contact[]):Promise<void>;
export async function touch(table:'chat'|'contact',data:ChatMessage|ChatMessage[]|Contact|Contact[]):Promise<void>{
    const collection = database.get(table);
    const item = Array.isArray(data) ? data : [data];
    await database.write(async ()=>{
        await Promise.all(item.map(row=>collection.create(rec=>{
            Object.entries(row).forEach((key,val)=>{
                // @ts-ignore
                rec[key] = val ?? ('new' == key ? 0 : '');
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

export function rm(table:'chat', foreignKey:number):Promise<void>;
export function rm(table:'contact', foreignKey:string):Promise<void>;
export async function rm(table:'chat'|'contact', foreignKey:number|string):Promise<void>{
    const collection = database.get(table);
    const [rec] = await collection.query(Q.where( 'chat' == table ? 'time' : 'uid', foreignKey )).fetch()
    if(!rec) return;
    await database.write(async ()=>{
        await rec.destroyPermanently();
    })
}
