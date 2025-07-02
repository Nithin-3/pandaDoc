import {appSchema, tableSchema} from "@nozbe/watermelondb";
export const schema = appSchema({
    version:1,
    tables:[
        tableSchema({
            name:'chat',
            columns:[
                {name:'msg',type:'string',isOptional:true},
                {name:'uri',type:'string',isOptional:true},
                {name:'time',type:'number',isIndexed:true},
                {name:'who',type:'string'},
                {name:'uid',type:'string'}
            ]
        }),
        tableSchema({
            name:'contact',
            columns:[
                {name:'name',type:'string'},
                {name:'uid',type:'string',isIndexed:true},
                {name:'new',type:'number',isOptional:true},
                {name:'at',type:'number'}
            ]
        })
    ]
})
