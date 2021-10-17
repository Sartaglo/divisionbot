"use strict";

const { Guild, GuildChannel } = require("discord.js");
const { readConfiguration } = require("./read-configuration");
const { writeConfiguration } = require("./write-configuration");

exports.watch = async (guild, channel) => {
    if (!(guild instanceof Guild) || !(channel instanceof GuildChannel)) {
        return;
    }

    const existingConfiguration = readConfiguration(guild.id);
    const configuration = typeof existingConfiguration === "object" && existingConfiguration !== null
        ? existingConfiguration
        : {};
    configuration.watch = !configuration.watch;
    writeConfiguration(guild.id, configuration);
    await channel.send(
        configuration.watch
            ? "I am now giving roles to users joining the server."
            : "I am no longer giving roles to users joining the server.",
    );
};
