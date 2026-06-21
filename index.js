import express from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import QRCode from "qrcode";

import baileys from "@whiskeysockets/baileys";

import pino from "pino";

import {
  loadCommands,
  loadObservers,
  runCommand
} from "./router.js";


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

res.send(`

<!DOCTYPE html>

<html>

<body style="background:#111;color:white;text-align:center;font-family:Arial">

<h1>🚀 ADEZ-MD</h1>

<p>Scan WhatsApp QR</p>

<img id="qr" width="300">


<script src="/socket.io/socket.io.js"></script>

<script>

const socket = io();


socket.on("qr",(data)=>{

document.getElementById("qr").src=data;

});


</script>


</body>

</html>

`);

});





let sock;


let starting = false;



async function startBot(){


if(starting) return;

starting = true;



const {state,saveCreds} =

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
"messages.upsert",
async({messages})=>{


const msg = messages[0];


if(!msg.message) return;


await runCommand(
sock,
msg
);


});






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



const image =

await QRCode.toDataURL(qr);



io.emit(
"qr",
image
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



const error =
lastDisconnect?.error;



const reason =
error?.output?.statusCode;



console.log(
"Connection closed:",
reason
);





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



}



startBot();





httpServer.listen(
PORT,
()=>{


console.log(
`🚀 ADEZ-MD running on ${PORT}`
);


});
