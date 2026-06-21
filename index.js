import express from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

import baileys from "@whiskeysockets/baileys";
import pino from "pino";
import QRCode from "qrcode";


import {
  loadCommands,
  loadObservers,
  runCommand
} from "./lib/router.js";



const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = baileys;



dotenv.config();



const app = express();

const httpServer = createServer(app);



const io = new Server(httpServer,{
  cors:{
    origin:"*"
  }
});



const PORT = process.env.PORT || 3000;



app.get("/",(req,res)=>{

res.json({

status:"online",

bot:"ADEZ-MD"

});

});



let sock;

let starting=false;




async function startBot(){


if(starting) return;


starting=true;



const {state,saveCreds}=

await useMultiFileAuthState("./session");





sock = makeWASocket({

auth:state,


logger:pino({

level:"silent"

}),


syncFullHistory:false,


fireInitQueries:false


});





sock.ev.on(
"creds.update",
saveCreds
);






await loadCommands();

await loadObservers();







sock.ev.on(
"connection.update",
async(update)=>{


const {

connection,

lastDisconnect,

qr

}=update;





if(qr){


console.log(
"QR Generated"
);



const qrImage =

await QRCode.toDataURL(qr);



io.emit(
"qr",
qrImage
);



}






if(connection==="open"){


console.log(
"✅ ADEZ-MD Connected"
);


starting=false;


}







if(connection==="close"){



starting=false;



const reason =

lastDisconnect
?.error
?.output
?.statusCode;



console.log(
"Disconnected:",
reason
);






if(reason === 405){


console.log(
"Session rejected. Delete session and scan again."
);


return;


}






if(reason === DisconnectReason.loggedOut){


console.log(
"Logged out. Delete session."
);


return;


}






console.log(
"Reconnecting in 5 seconds..."
);





setTimeout(()=>{


startBot();


},5000);



}



});






sock.ev.on(
"messages.upsert",
async({messages})=>{


const msg = messages[0];


if(!msg.message) return;



try{


await runCommand(
sock,
msg
);


}catch(err){


console.log(
"Command error:",
err
);


}


});


}





startBot();






httpServer.listen(
PORT,
()=>{


console.log(

`🚀 ADEZ-MD running on ${PORT}`

);


});
