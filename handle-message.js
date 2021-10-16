"use strict";

const { Client, Guild, GuildChannel, GuildMember, Message, User } = require("discord.js");
const { check } = require("./check");
const { settings } = require("./settings");

exports.handleMessage = async (message) => {
    if (!(message instanceof Message)
        || !(message.client instanceof Client)
        || !(message.author instanceof User)
        || message.author.bot
        || typeof message.content !== "string"
        || !(message.guild instanceof Guild)
        || typeof message.guild.id !== "string"
        || message.guild.id.length === 0
        || !(message.channel instanceof GuildChannel)
        || !(message.guild.me instanceof GuildMember)
        || !message.channel.permissionsFor(message.guild.me).has("SEND_MESSAGES")) {
        return;
    }

    const content = message.content.replace(/\s+/g, " ").trim().toUpperCase();

    if (!content.startsWith("=")) {
        return;
    }

    const segments = content.slice(1).split(" ");
    const command = segments[0];
    const options = segments.slice(1);

    if (command === "CHECK") {
        await check(message, options);

        return;
    }

    if (command === "SETTINGS") {
        await settings(message, options);

        return;
    }

    if (command === "STOP") {
        await message.channel.send("Goodbye.");
        message.client.destroy();

        return;
    }

    await message.channel.send("Invalid command.");
};
