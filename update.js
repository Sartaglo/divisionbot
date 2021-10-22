"use strict";

const { Guild, GuildMember, GuildChannel } = require("discord.js");
const { parsePlayer } = require("./parse-player");
const { readConfiguration } = require("./read-configuration");

exports.update = async (guild, channel, parameters) => {
    if (!(guild instanceof Guild) || !Array.isArray(parameters)) {
        return;
    }

    if (!guild.me.permissions.has("MANAGE_ROLES")) {
        if (channel instanceof GuildChannel) {
            await channel.send("I do not have permission to manage roles in this server.");
        }

        return;
    }

    const configuration = readConfiguration(guild.id);

    if (typeof configuration !== "object" || configuration === null) {
        if (channel instanceof GuildChannel) {
            await channel.send("This server does not have any settings.");
        }

        return;
    }

    if (!configuration.watch) {
        return;
    }

    if (!Array.isArray(configuration.divisions) || configuration.divisions.length === 0) {
        if (channel instanceof GuildChannel) {
            await channel.send("This server does not have any divisions.");
        }

        return;
    }

    if (typeof parameters[0] === "string" && parameters[0].length > 0) {
        const { userId, userRoles } = await parsePlayer(guild, configuration, parameters[0]);

        if (typeof userId !== "string" || userId.length === 0 || !Array.isArray(userRoles)) {
            return;
        }

        const member = await guild.members.fetch(userId);

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

        if (channel instanceof GuildChannel) {
            await channel.send("Updated that user's roles.");
        }

        return;
    }

    const members = await guild.members.fetch();

    try {
        await Promise.all(
            members.map(
                (member) => new Promise(
                    async (resolve) => {
                        const { userId, userRoles } = await parsePlayer(guild, configuration, member.user.id);

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

        if (channel instanceof GuildChannel) {
            await channel.send("Updated the roles of everyone in this server.");
        }
    } catch (error) {
        console.error(error);

        if (channel instanceof GuildChannel) {
            await channel.send("Error updating roles.");
        }
    }
};
