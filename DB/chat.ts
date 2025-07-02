import {Model} from '@nozbe/watermelondb';
import {field,text} from '@nozbe/watermelondb/decorators';
export default class Chat extends Model{
    static table = 'chat';
    // @ts-ignore
    @text('msg') msg
    // @ts-ignore
    @text('uri') uri
    // @ts-ignore
    @field('time') time
    // @ts-ignore
    @text('who') who
    // @ts-ignore
    @text('uid') uid
}
