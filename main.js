"use strict";

const { Client, Intents } = require("discord.js");
const { handleMessage } = require("./handle-message");
const { update } = require("./update");

const handleError = async (caughtError) => {
    console.error(caughtError);

    try {
        const admin = await client.users.fetch('484822486861611011');
        await admin.send(JSON.stringify(caughtError));
    } catch (error) {
        console.error(error);
    }

    client.destroy();
};

const client = new Client(
    { intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES] },
);
client.once(
    "ready",
    () => {
        console.log("Ready!");
    },
);
client.on(
    "messageCreate",
    async (message) => {
        try {
            await handleMessage(message);
        } catch (error) {
            await handleError(error);
        }
    },
);
client.on(
    "guildMemberAdd",
    async (member) => {
        try {
            await update(member.guild, null, [member.user.id]);
        } catch (error) {
            await handleError(error);
        }
    },
);

try {
    client.login(process.env.DISCORD_TOKEN);
} catch (error) {
    handleError(error);
}
