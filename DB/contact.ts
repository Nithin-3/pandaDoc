import {Model} from '@nozbe/watermelondb';
import {field,text} from '@nozbe/watermelondb/decorators';
export default class Contact extends Model{
    static table = 'contact';
    // @ts-ignore
    @text('name') name
    // @ts-ignore
    @text('uid') uid
    // @ts-ignore
    @field('new') new
    // @ts-ignore
    @field('at') at
}
