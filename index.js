import express from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import QRCode from "qrcode";

import {
  default as makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";

import pino from "pino";

import {
  loadCommands,
  loadObservers
} from "./router.js";


dotenv.config();


const app = express();

const httpServer = createServer(app);


const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
});


const PORT = process.env.PORT || 3000;


app.get("/", (req,res)=>{

res.send(`

<!DOCTYPE html>

<html>

<head>

<title>ADEZ-MD</title>

<style>

body{
background:#111;
color:white;
text-align:center;
font-family:Arial;
}

img{
width:300px;
margin-top:30px;
}

</style>

</head>


<body>

<h1>🚀 ADEZ-MD</h1>

<p>WhatsApp Bot Online</p>


<img id="qr"/>


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



async function startBot(){


const {state,saveCreds} =
await useMultiFileAuthState("./session");



sock = makeWASocket({

auth: state,

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



sock.ev.on(
"connection.update",
async(update)=>{


const {
connection,
lastDisconnect,
qr
}=update;



if(qr){

console.log("QR Generated");


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


}



if(connection==="close"){



const reason =
lastDisconnect
?.error
?.output
?.statusCode;



if(reason === DisconnectReason.loggedOut){


console.log(
"Logged out"
);


}

else{


console.log(
"Reconnecting..."
);


startBot();


}


}



}

);



await loadCommands();

await loadObservers();



}



startBot();



httpServer.listen(
PORT,
()=>{

console.log(
`🚀 ADEZ-MD running on ${PORT}`
);

});
