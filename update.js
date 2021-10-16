"use strict";

const { GuildMember, Message } = require("discord.js");
const { parsePlayer } = require("./parse-player");
const { readConfiguration } = require("./read-configuration");

exports.update = async (message, parameters) => {
    if (!(message instanceof Message) || !Array.isArray(parameters)) {
        return;
    }

    if (!message.guild.me.permissions.has("MANAGE_ROLES")) {
        await message.channel.send("I do not have permission to manage roles in this server.");

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

    if (typeof parameters[0] === "string" && parameters[0].length > 0) {
        const { userId, userRoles } = await parsePlayer(message, configuration, parameters[0]);

        if (typeof userId !== "string" || userId.length === 0 || !Array.isArray(userRoles)) {
            return;
        }

        const member = await message.guild.members.fetch(userId);

        if (!(member instanceof GuildMember)) {
            return;
        }

        for (const userRole of userRoles) {
            if (userRole.belongsInDivision) {
                await member.roles.add(userRole.roleId);
            } else {
                await member.roles.remove(userRole.roleId);
            }
        }

        await message.channel.send("Updated user's roles.");

        return;
    }

    const members = await message.guild.members.fetch();

    try {
        await Promise.all(
            members.map(
                (member) => new Promise(
                    async (resolve) => {
                        const { userId, userRoles } = await parsePlayer(message, member.id);

                        if (typeof userId !== "string" || userId.length === 0 || !Array.isArray(userRoles)) {
                            resolve();

                            return;
                        }

                        for (const userRole of userRoles) {
                            if (userRole.belongsInDivision) {
                                await member.roles.add(userRole.roleId);
                            } else {
                                await member.roles.remove(userRole.roleId);
                            }
                        }

                        resolve();
                    },
                ),
            ),
        );
        await message.channel.send("Updated the roles of everyone in this server.");
    } catch (error) {
        console.error(error);
        await message.channel.send("Error updating roles.");
    }
};
