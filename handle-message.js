"use strict";

const { Client, Guild, GuildChannel, GuildMember, Message, User } = require("discord.js");
const { check } = require("./check");
const { settings } = require("./settings");
const { update } = require("./update");
const { watch } = require("./watch");

const adminId = "484822486861611011";

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
    const parameters = segments.slice(1);

    if (command === "GUILDS") {
        if (message.author.id !== adminId) {
            return;
        }

        try {
            const guilds = Array.from(message.client.guilds.cache.values());
            await message.channel.send(
                "I am in the following guild"
                + (guilds.length === 1 ? "" : "s")
                + ":\n"
                + guilds
                    .map((guild) => guild.name + " (" + guild.id + ")")
                    .join("\n"),
            );
        } catch (error) {
            console.error(error.stack);
            await admin.send(error.stack);
        }
    }

    if (command === "CHECK") {
        await check(message.guild, message.channel, parameters);

        return;
    }

    if (command === "SETTINGS") {
        await settings(message, parameters);

        return;
    }

    if (command === "STOP") {
        await message.channel.send("Goodbye.");
        message.client.destroy();

        return;
    }

    if (command === "UPDATE") {
        await update(message.guild, message.channel, parameters);

        return;
    }

    if (command === "WATCH") {
        await watch(message.guild, message.channel);

        return;
    }

    await message.channel.send("Invalid command.");
};
