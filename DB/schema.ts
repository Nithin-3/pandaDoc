import {appSchema, tableSchema} from "@nozbe/watermelondb";
export const schema = appSchema({
    version:1,
    tables:[
        tableSchema({
            name:'chat',
            columns:[
                {name:'msg',type:'string'},
                {name:'uri',type:'string'},
                {name:'time',type:'number'},
                {name:'who',type:'string'},
                {name:'uid',type:'string'}
            ]
        }),
        tableSchema({
            name:'contact',
            columns:[
                {name:'name',type:'string'},
                {name:'uid',type:'string'},
                {name:'new',type:'number'},
                {name:'at',type:'number'}
            ]
        })
    ]
})
