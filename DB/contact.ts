import {Model} from '@nozbe/watermelondb';
import {field,text} from '@nozbe/watermelondb/decorators';
export default class Contact extends Model{
    static table = 'contact';
    // @ts-ignore
    @text('name') name!:string;
    // @ts-ignore
    @text('uid') uid!:string;
    // @ts-ignore
    @field('new') new?:number;
    // @ts-ignore
    @field('at') at!:number;
}
