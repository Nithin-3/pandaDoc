import {Model} from '@nozbe/watermelondb';
import {field,text} from '@nozbe/watermelondb/decorators';
export default class Chat extends Model{
    static table = 'chat';
    // @ts-ignore
    @text('msg') msg?:string;
    // @ts-ignore
    @text('uri') uri?:string;
    // @ts-ignore
    @field('time') time!:number;
    // @ts-ignore
    @text('who') who!:string;
    // @ts-ignore
    @text('uid') uid!:string;
}
