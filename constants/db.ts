import * as SQLite from 'expo-sqlite';
import { ChatMessage } from './file';

export interface Contact {
    id: string;
    name: string;
    new?: number;
}

export class ContactDB {
    private static db: SQLite.SQLiteDatabase | null = null;

    static async init() {
        if (!ContactDB.db) {
            ContactDB.db = await SQLite.openDatabaseAsync('contact.db');
            await ContactDB.db.execAsync(` CREATE TABLE IF NOT EXISTS contacts ( id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, new INTEGER, at INTEGER NOT NULL DEFAULT (strftime('%s','now')) );`);
        }
    }

    static async add(contact: Contact) {
        await ContactDB.init();
        const id = contact.id.replace(/'/g, "''");
        const name = contact.name.replace(/'/g, "''");
        const newVal = contact.new ?? 'NULL';
        await ContactDB.db!.execAsync( `INSERT OR REPLACE INTO contacts (id, name, new) VALUES ('${id}', '${name}', ${newVal});`);
        await this.emit();
    }

    static async get(id: string): Promise<Contact | undefined>;
    static async get(): Promise<Contact[]>;
    static async get(id?: string): Promise<Contact | Contact[] | undefined> {
        await ContactDB.init();

        if (id) {
            const safeId = id.replace(/'/g, "''");
            return await ContactDB.db!.getFirstAsync( `SELECT * FROM contacts WHERE id = '${safeId}';` ) as Contact;
        }

        const contacts: Contact[] = [];
        for await (const row of ContactDB.db!.getEachAsync(`SELECT * FROM contacts ORDER BY CASE WHEN new IS NULL THEN 1 ELSE 0 END, new DESC, at DESC;`)) {
            contacts.push(row as Contact);
        }
        return contacts;
    }

    static async edit(id: string, values: { name?: string; new?: number | null }) {
        await ContactDB.init();

        const updates: string[] = [];

        if (values.name !== undefined) {
            updates.push(`name = '${values.name.replace(/'/g, "''")}'`);
        }

        if (values.new !== undefined) {
            updates.push(`new = ${values.new ?? 'NULL'}`);
        }

        if (!updates.length) return;
        updates.push(`at = strftime('%s','now')`);
        const safeId = id.replace(/'/g, "''");
        await ContactDB.db!.execAsync(`UPDATE contacts SET ${updates.join(', ')} WHERE id = '${safeId}';`);
        await this.emit();
    }

    static async delete(id: string) {
        await ContactDB.init();
        const safeId = id.replace(/'/g, "''");
        await ContactDB.db!.execAsync(`DELETE FROM contacts WHERE id = '${safeId}';`);
        await this.emit();
    }

    private static listeners:Set<(contacts:Contact[])=>void> = new Set();

    static onChange(callback:(contacts:Contact[])=>void){
        this.listeners.add(callback);
    }

    static offChange(callback:(contacts:Contact[])=>void){
        this.listeners.delete(callback);
    }

    private static async emit(){
        const con = await this.get();
        this.listeners.forEach(cb=>cb(con as Contact[]));
    }
}

export class Chat {
    chat:SQLite.SQLiteDatabase|null = null;
    constructor(private uid:string) {
        this.init();
    }
    private async init(){
        this.chat = await SQLite.openDatabaseAsync('chat.db');
        this.chat.execAsync(`CREATE IF NOT EXISTS ${this.uid} (msg TEXT, uri TEXT, who TEXT NOT NULL, time INTEGER NOT NULL PRIMARY KEY)`)
    }

    async add(message:ChatMessage[]){
        if(!message.length) return;
        await this.chat?.execAsync(`INSERT OR REPLACE INTO ${this.uid} (msg, uri, who, time) VALUES ${ (await Promise.all(message.map(async v =>`(${v.msg ? v.msg.replace(/'/g, "") : 'NULL'}, ${v.uri ? v.uri.replace(/'/g, "") : 'NULL'}, ${v.who.replace(/'/g, "")}, ${v.time})`))).join(', ')};`);
    }
}
