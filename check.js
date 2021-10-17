"use strict";

const { Guild, GuildChannel } = require("discord.js");
const { parsePlayer } = require("./parse-player");
const { readConfiguration } = require("./read-configuration");

exports.check = async (guild, channel, parameters) => {
    if (!(guild instanceof Guild) || !(channel instanceof GuildChannel) || !Array.isArray(parameters)) {
        return;
    }

    const configuration = readConfiguration(guild.id);

    if (typeof configuration !== "object" || configuration === null) {
        await channel.send("This server does not have any settings.");

        return;
    }

    if (!Array.isArray(configuration.divisions) || configuration.divisions.length === 0) {
        await channel.send("This server does not have any divisions.");

        return;
    }

    if (parameters.length === 0) {
        await channel.send("No user ID provided.");

        return;
    }

    const { userId, playerName, userRoles } = await parsePlayer(guild, configuration, parameters[0]);

    if (typeof userId !== "string" || userId.length === 0) {
        await channel.send("Player not found.");

        return;
    }

    const roleList = userRoles
        .filter((userRole) => userRole.belongsInDivision)
        .map((userRole) => `<@&${userRole.roleId}>`).join(", ");
    await channel.send({ content: `<@${userId}> ${playerName} ${roleList}`, allowedMentions: { parse: [] } });
};
