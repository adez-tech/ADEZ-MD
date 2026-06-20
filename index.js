import express from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import {
  default as makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";
import pino from "pino";
import {
 loadCommands,
 loadObservers,
 runCommand
} from "./lib/router.js";
dotenv.config();

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
});

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({
    status: "online",
    bot: "ADEZ-MD"
  });
});


let sock;

async function startBot(){

  const { state, saveCreds } =
    await useMultiFileAuthState("./session");


  sock = makeWASocket({

    auth: state,

    logger: pino({
      level: "silent"
    }),

    printQRInTerminal: true,

    syncFullHistory: false,

    fireInitQueries: false

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
      } = update;


      if(qr){

        console.log(
          "Scan QR:",
          qr
        );

        io.emit(
          "qr",
          qr
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
            "Logged out. Delete session and login again."
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

}


startBot();


httpServer.listen(
PORT,
()=>{

console.log(
`🚀 ADEZ-MD running on ${PORT}`
);

});
