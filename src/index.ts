import { Client, Message, LocalAuth } from 'whatsapp-web.js'
import { Commands, WhatsappInteraction } from './utils/whatsappCommand';
import { parseMessageArgs, parseRawArgs } from './utils/argParser';
import database from './utils/database';
import debugging, { logger } from './utils/debugging';
const qrcode = require('qrcode-terminal');

export const prefix = '!';
export const version = process.env.npm_package_version;

require('dotenv').config('../.env');

// Create a new client instance
const client = new Client({
  authStrategy: new LocalAuth()
});

// When the client is ready, run this code (only once)
client.once('ready', () => {
    logger('Client is ready!');
});

client.on('message_create', async (msg: Message) => {
  if (msg.body.startsWith(prefix)) {
    let commandName = msg.body.toLowerCase().slice(prefix.length).split(/\s+/)[0];
    let command = Commands.find(c => c.name === commandName);
    if (command) {
      try {
        await command.run(new WhatsappInteraction(msg, parseMessageArgs(parseRawArgs(msg.body).slice(1), command.options)));
      } catch (err: any) {
        await msg.reply("🆘 Whoops! I've caught an error:\n```" + err + "```");
      }
    }
  }
})

// When the client received QR-Code
client.on('qr', (qr: any) => {
  qrcode.generate(qr, {small: true});
});

database("./data.db");
debugging();
// Start your client
client.initialize();
