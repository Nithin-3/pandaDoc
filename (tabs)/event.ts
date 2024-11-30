import {useState} from 'react'
export function inIT(){
    const [data,setdata]=useState([]);
    const clone = ()=>{return {data,setdata}}
    return [data,setdata,clone];
}
