export const name = "menu";

export const category = "General";


export async function run({

sock,

msg

}){


const jid = msg.key.remoteJid;


await sock.sendMessage(

jid,

{

text:

`🤖 *ADEZ-MD MENU*

👋 Hello!

Commands:

.menu

Bot Status:
✅ Online

Created by ADEZ-MD`

}

);


}
