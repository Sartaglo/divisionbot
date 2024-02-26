"use strict";

const { Message, Role } = require("discord.js");
const { readConfiguration } = require("./read-configuration");
const { writeConfiguration } = require("./write-configuration");

exports.settings = async (message, parameters) => {
    if (!(message instanceof Message) || !Array.isArray(parameters)) {
        return;
    }

    const existingConfiguration = readConfiguration(message.guild.id);
    const configuration = typeof existingConfiguration === "object" && existingConfiguration !== null
        ? existingConfiguration
        : {};

    if (parameters[0] === "BASEROLE") {
        if (parameters.length === 1) {
            delete configuration.baseRole;
            writeConfiguration(message.guild.id, configuration);
            await message.channel.send("Base role cleared.");

            return;
        }

        if (parameters.length === 2) {
            const role = await message.guild.roles.fetch(parameters[1]);

            if (!(role instanceof Role)) {
                await message.channel.send("Invalid role ID provided.");

                return;
            }

            configuration.baseRole = role.id;
            writeConfiguration(message.guild.id, configuration);
            await message.channel.send("Base role set.");

            return;
        }
    }

    if (parameters[0] === "+") {
        const role = await message.guild.roles.fetch(parameters[1]);

        if (!(role instanceof Role)) {
            await message.channel.send("Invalid role ID provided.");

            return;
        }

        if (!Array.isArray(configuration.divisions)) {
            configuration.divisions = [];
        }

        configuration.divisions.push({ roleId: role.id });
        writeConfiguration(message.guild.id, configuration);
        await message.channel.send("Division created.");

        return;
    }

    if (!Array.isArray(configuration.divisions) || configuration.divisions.length === 0) {
        await message.channel.send("This server does not have any divisions.");

        return;
    }

    if (parameters.length === 0) {
        await message.channel.send(
            {
                content: "This server has the following divisions:\n"
                    + configuration.divisions
                        .map((division, index) => `(${index + 1}) <@&${division.roleId}>`)
                        .join("\n"),
                allowedMentions: {
                    parse: []
                },
            },
        );

        return;
    }

    const division = configuration.divisions[Number.parseInt(parameters[0], 10) - 1];

    if (typeof division !== "object" || division === null) {
        await message.channel.send("No such division exists for this server.");

        return;
    }

    if (parameters[1] === "+") {
        const leaderboardId = Number.parseInt(parameters[2], 10);

        if (!Number.isInteger(leaderboardId)) {
            await message.channel.send("Invalid leaderboard ID.");

            return;
        }

        const property = parameters[3];

        if (property !== "PEAKMMR") {
            await message.channel.send("Unsupported property provided.");

            return;
        }

        const operator = parameters[4];

        if (operator !== ">=" && operator !== "<=") {
            await message.channel.send("Unsupported operator provided.");

            return;
        }

        const value = Number.parseInt(parameters[5], 10);

        if (!Number.isInteger(value)) {
            await message.channel.send("Unsupported value provided.");

            return;
        }

        if (!Array.isArray(division.requirements)) {
            division.requirements = [];
        }

        division.requirements.push({ property, leaderboardId, operator, value });
        writeConfiguration(message.guild.id, configuration);
        await message.channel.send("Requirement added.");

        return;
    }

    if (parameters[1] === "-") {
        configuration.divisions.splice(configuration.divisions.indexOf(division), 1);
        writeConfiguration(message.guild.id, configuration);
        await message.channel.send("Division deleted.");

        return;
    }

    if (parameters.length === 1) {
        if (!Array.isArray(division.requirements) || division.requirements.length === 0) {
            await message.channel.send("That division does not have any requirements.");

            return;
        }

        await message.channel.send(
            "That division has the following requirements:\n"
            + division.requirements
                .map(
                    (requirement, index) =>
                        `(${index + 1}) ${requirement.property} ${requirement.leaderboardId || 3} ${requirement.operator} ${requirement.value}`,
                )
                .join('\n'),
        );

        return;
    }

    if (!Array.isArray(division.requirements) || division.requirements.length === 0) {
        await message.channel.send("That division does not have any requirements.");

        return;
    }

    const requirement = division.requirements[Number.parseInt(parameters[1], 10) - 1];

    if (typeof requirement !== "object" || requirement === null) {
        await message.channel.send("No such requirement exists for that division.");

        return;
    }

    if (parameters[2] === "-") {
        division.requirements.splice(division.requirements.indexOf(requirement), 1);
        writeConfiguration(message.guild.id, configuration);
        await message.channel.send("Requirement deleted.");

        return;
    }

    await message.channel.send("Invalid configuration provided.");
};
