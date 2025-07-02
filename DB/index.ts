import SqAdapt from '@nozbe/watermelondb/adapters/sqlite';
import {Database} from '@nozbe/watermelondb';
import {schema} from './schema';
import Chat from './chat';
import Contact from './contact';
const adapter = new SqAdapt({schema});
export const database = new Database({adapter,modelClasses:[Chat,Contact]})
