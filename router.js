import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const commands = new Map();
const observers = [];

export async function loadCommands() {

  const folder = "./commands";

  if (!fs.existsSync(folder)) {
    console.log("commands folder missing");
    return;
  }

  async function scan(dir) {

    const files = fs.readdirSync(dir);

    for (const file of files) {

      const full = path.join(dir, file);

      if (fs.statSync(full).isDirectory()) {
        await scan(full);
        continue;
      }

      if (!file.endsWith(".js")) continue;

      try {

        const cmd = await import(
          pathToFileURL(full)
        );

        if (!cmd.name) {
          console.log(`❌ FAILED ${file}: missing name`);
          continue;
        }

        if (commands.has(cmd.name)) {
          console.log(`⚠️ Duplicate command skipped: ${cmd.name}`);
          continue;
        }


        commands.set(cmd.name, cmd);

        console.log(
          `✅ Loaded: ${cmd.name} [${cmd.category || "Unknown"}]`
        );


      } catch(error){

        console.log(
          `❌ FAILED ${file}:`,
          error.stack
        );

      }

    }

  }


  await scan(folder);

}



export function getAllCommands(){

  return commands;

}



export async function loadObservers(){

 const folder="./observers";

 if(!fs.existsSync(folder)) return;


 for(const file of fs.readdirSync(folder)){

   if(!file.endsWith(".js")) continue;


   try{

    const obs = await import(
      pathToFileURL(
        path.join(folder,file)
      )
    );

    observers.push(obs);

    console.log(
      `👀 Observer loaded: ${file}`
    );


   }catch(error){

    console.log(
      `❌ Observer failed ${file}`,
      error.stack
    );

   }

 }

}



export async function runCommand(
 sock,
 msg,
 prefix="."
){

 try{


 const text =
 msg.message?.conversation ||
 "";


 if(!text.startsWith(prefix))
 return;


 const args=text
 .slice(prefix.length)
 .trim()
 .split(/\s+/);


 const name=args.shift()
 .toLowerCase();



 const command=commands.get(name);


 if(!command)
 return;



 await command.run({
  sock,
  msg,
  args
 });



 }catch(error){

 console.log(
 "❌ COMMAND ERROR:",
 error.stack
 );


 }

      }
