"use strict";

const { Client, Intents } = require("discord.js");
const { handleMessage } = require("./handle-message");

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
client.once(
    "ready",
    () => {
        console.log("Ready!");
    },
);
client.on(
    "messageCreate",
    async (message) => {
        await handleMessage(message);
    },
);

try {
    client.login(process.env.DISCORD_TOKEN);
} catch (error) {
    console.error(error);
    client.destroy();
}
