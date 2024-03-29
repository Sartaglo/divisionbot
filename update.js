"use strict";

const { Guild, GuildChannel, GuildMember, Message, Role } = require("discord.js");
const { parsePlayer } = require("./parse-player");
const { readConfiguration } = require("./read-configuration");

exports.update = async (guild, channel, parameters) => {
    if (!(guild instanceof Guild) || !Array.isArray(parameters)) {
        return;
    }

    const hasChannel = channel instanceof GuildChannel;
    const canManageNicknames = guild.me.permissions.has("MANAGE_NICKNAMES");

    if (!canManageNicknames && hasChannel) {
        await channel.send("I do not have permission to manage nicknames in this server.");
    }

    const existingConfiguration = readConfiguration(guild.id);
    const configuration = typeof existingConfiguration === "object" && existingConfiguration !== null
        ? existingConfiguration
        : {};

    if (!Array.isArray(configuration.divisions)) {
        configuration.divisions = [];
    }

    const hasDivisions = configuration.divisions.length > 0;
    const canManageRoles = guild.me.permissions.has("MANAGE_ROLES");

    if (hasDivisions && !canManageRoles && hasChannel) {
        await channel.send("I do not have permission to manage roles in this server.");
    }

    if (!hasChannel && !configuration.watch) {
        return;
    }

    const hasDivisionsAndCanManageRoles = hasDivisions && canManageRoles;

    if (typeof parameters[0] === "string" && parameters[0].length > 0) {
        const { userId, playerName, userRoles } = await parsePlayer(guild, configuration, parameters[0]);

        if (typeof userId !== "string" || userId.length === 0 || !Array.isArray(userRoles)) {
            return;
        }

        const member = await guild.members.fetch(userId);

        if (!(member instanceof GuildMember)) {
            return;
        }

        let updatedNickname = false;

        if (canManageNicknames) {
            try {
                await member.setNickname(playerName);
                updatedNickname = true;
            } catch (error) {
                console.error(error);
            }
        }

        let updatedRoles = false;

        if (hasDivisionsAndCanManageRoles) {
            try {
                for (const userRole of userRoles) {
                    if (userRole.belongsInDivision) {
                        await member.roles.add(userRole.roleId);
                    } else {
                        await member.roles.remove(userRole.roleId);
                    }
                }

                updatedRoles = true;
            } catch (error) {
                console.error(error);
            }
        }

        if (hasChannel) {
            if (updatedNickname && updatedRoles) {
                await channel.send("Updated that user's name and roles.");
            } else if (updatedNickname) {
                await channel.send("Updated that user's name.");
            } else if (updatedRoles) {
                await channel.send("Updated that user's roles.");
            }
        }

        return;
    }

    const message = hasChannel ? await channel.send("Fetching the users in this server...") : null;
    const hasMessage = message instanceof Message;
    const baseRole = typeof configuration.baseRole === "string"
        ? await message.guild.roles.fetch(configuration.baseRole)
        : null;
    const members = await guild.members.fetch();
    const baseRoledMembers = baseRole instanceof Role
        ? members.filter((member) => member.roles.cache.some((role) => role.id === baseRole.id))
        : members;
    const baseRoleSuffix = baseRole instanceof Role ? ` with role ${baseRole.name}` : '';
    let count = 0;

    try {
        await Promise.all(
            baseRoledMembers.map(
                (member) => new Promise(
                    async (resolve) => {
                        const {
                            userId,
                            playerName,
                            userRoles,
                        } = await parsePlayer(guild, configuration, member.user.id);

                        if (typeof userId !== "string" || userId.length === 0 || !Array.isArray(userRoles)) {
                            resolve();

                            return;
                        }

                        let hasError = false;

                        if (canManageNicknames) {
                            try {
                                await member.setNickname(playerName);
                            } catch (error) {
                                console.error(error);
                                hasError = true;
                            }
                        }

                        if (hasDivisionsAndCanManageRoles) {
                            for (const userRole of userRoles) {
                                if (userRole.belongsInDivision) {
                                    try {
                                        await member.roles.add(userRole.roleId);
                                    } catch (error) {
                                        console.error(error);
                                        hasError = true;
                                    }
                                } else {
                                    try {
                                        await member.roles.remove(userRole.roleId);
                                    } catch (error) {
                                        console.error(error);
                                        hasError = true;
                                    }
                                }
                            }
                        }

                        if (hasError) {
                            resolve();

                            return;
                        }

                        count += 1;

                        if (hasMessage) {
                            if (canManageNicknames && hasDivisionsAndCanManageRoles) {
                                await message.edit(
                                    `Updating the names and roles of users... ${count}/${baseRoledMembers.size}`,
                                );
                            } else if (canManageNicknames) {
                                await message.edit(`Updated the names of users... ${count}/${baseRoledMembers.size}`);
                            } else if (canManageRoles) {
                                await message.edit(`Updated the roles of users... ${count}/${baseRoledMembers.size}`);
                            }
                        }

                        resolve();
                    },
                ),
            ),
        );

        if (hasMessage) {
            if (canManageNicknames && hasDivisionsAndCanManageRoles) {
                await message.edit(`Updated the names and roles of ${count}/${baseRoledMembers.size} users${baseRoleSuffix}.`);
            } else if (canManageNicknames) {
                await message.edit(`Updated the names of ${count}/${baseRoledMembers.size} users${baseRoleSuffix}.`);
            } else if (canManageRoles) {
                await message.edit(`Updated the roles of ${count}/${baseRoledMembers.size} users${baseRoleSuffix}.`);
            }
        }
    } catch (error) {
        console.error(error);

        if (hasMessage) {
            if (canManageNicknames && hasDivisionsAndCanManageRoles) {
                await message.edit("Error updating name and roles.");
            } else if (canManageNicknames) {
                await message.edit("Error updating name.");
            } else if (canManageRoles) {
                await message.edit("Error updating roles.");
            }
        }
    }
};
