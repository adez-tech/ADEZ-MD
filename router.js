import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";


const commands = new Map();



async function scanFolder(folder){


if(!fs.existsSync(folder)){

console.log(
`⚠️ Folder missing: ${folder}`
);

return;

}



const files = fs.readdirSync(folder);



for(const file of files){


const fullPath =
path.join(folder,file);



if(fs.statSync(fullPath).isDirectory()){


await scanFolder(fullPath);


continue;

}




if(!file.endsWith(".js")) continue;




try{


const command = await import(

pathToFileURL(
path.resolve(fullPath)
).href

);



if(!command.name){


console.log(
`⚠️ ${file} missing export const name`
);


continue;

}





if(commands.has(command.name)){


console.log(

`⚠️ Duplicate command skipped: ${command.name}`

);


continue;

}





commands.set(

command.name,

command

);




console.log(

`✅ Loaded: ${command.name} [${command.category || "General"}]`

);




}

catch(error){


console.log(

`❌ FAILED ${file}:`

);


console.log(error.stack);


}



}



}





export async function loadCommands(){


await scanFolder("./commands");


}





export async function loadObservers(){



const folder="./observers";



if(!fs.existsSync(folder)){


console.log(
"⚠️ No observers folder"
);


return;

}



await scanFolder(folder);



console.log(
"✅ Observers loaded"
);



}







export function getAllCommands(){


return commands;


}








export function resolveLid(jid){



if(jid?.endsWith("@lid")){


return jid.replace(

"@lid",

"@s.whatsapp.net"

);


}



return jid;


}








export async function runCommand(sock,msg){



const text =

msg.message?.conversation ||

msg.message?.extendedTextMessage?.text;



if(!text) return;



if(!text.startsWith(".")) return;




const args = text

.slice(1)

.trim()

.split(/\s+/);



const commandName =

args.shift()

.toLowerCase();




const command =

commands.get(commandName);



if(!command) return;





try{


await command.execute(

sock,

msg,

args

);



}

catch(error){



console.log(

`❌ Command error ${commandName}`

);



console.log(

error.stack

);



}



}
