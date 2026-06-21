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
"Logged out. Delete session and login again."
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
