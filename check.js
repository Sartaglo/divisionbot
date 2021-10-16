"use strict";

const { Message } = require("discord.js");
const { parsePlayer } = require("./parse-player");
const { readConfiguration } = require("./read-configuration");

exports.check = async (message, parameters) => {
    if (!(message instanceof Message) || !Array.isArray(parameters)) {
        return;
    }

    const configuration = readConfiguration(message.guild.id);

    if (typeof configuration !== "object" || configuration === null) {
        await message.channel.send("This server does not have any settings.");

        return;
    }

    if (!Array.isArray(configuration.divisions) || configuration.divisions.length === 0) {
        await message.channel.send("This server does not have any divisions.");

        return;
    }

    if (parameters.length === 0) {
        await message.channel.send("No user ID provided.");

        return;
    }

    const { userId, playerName, userRoles } = await parsePlayer(message, configuration, parameters[0]);

    if (typeof userId !== "string" || userId.length === 0) {
        await message.channel.send("Player not found.");

        return;
    }

    const roleList = userRoles
        .filter((userRole) => userRole.belongsInDivision)
        .map((userRole) => `<@&${userRole.roleId}>`).join(", ");
    await message.channel.send({ content: `<@${userId}> ${playerName} ${roleList}`, allowedMentions: { parse: [] } });
};
