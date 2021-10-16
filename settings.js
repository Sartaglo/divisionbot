"use strict";

const { Message, Role } = require("discord.js");
const { readConfiguration } = require("./read-configuration");
const { writeConfiguration } = require("./write-configuration");

exports.settings = async (message, options) => {
    if (!(message instanceof Message) || !Array.isArray(options)) {
        return;
    }

    const existingConfiguration = readConfiguration(message.guild.id);
    const configuration = typeof existingConfiguration === "object" && existingConfiguration !== null
        ? existingConfiguration
        : {};

    if (options[0] === "+") {
        const role = await message.guild.roles.fetch(options[1]);

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
        await message.channel.send("This guild does not have any divisions.");

        return;
    }

    if (options.length === 0) {
        await message.channel.send(
            {
                content: "This guild has the following divisions:\n"
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

    const division = configuration.divisions[Number.parseInt(options[0], 10) - 1];

    if (typeof division !== "object" || division === null) {
        await message.channel.send("No such division exists for this guild.");

        return;
    }

    if (options[1] === "+") {
        const property = options[2];

        if (property !== "PEAKMMR") {
            await message.channel.send("Unsupported property provided.");

            return;
        }

        const operator = options[3];

        if (operator !== ">=" && operator !== "<=") {
            await message.channel.send("Unsupported operator provided.");

            return;
        }

        const value = Number.parseInt(options[4], 10);

        if (!Number.isInteger(value)) {
            await message.channel.send("Unsupported value provided.");

            return;
        }

        if (!Array.isArray(division.requirements)) {
            division.requirements = [];
        }

        division.requirements.push({ property, operator, value });
        writeConfiguration(message.guild.id, configuration);
        await message.channel.send("Requirement added.");

        return;
    }

    if (options[1] === "-") {
        configuration.divisions.splice(configuration.divisions.indexOf(division), 1);
        writeConfiguration(message.guild.id, configuration);
        await message.channel.send("Division deleted.");

        return;
    }

    if (options.length === 1) {
        if (!Array.isArray(division.requirements) || division.requirements.length === 0) {
            await message.channel.send("That division does not have any requirements.");

            return;
        }

        await message.channel.send(
            "That division has the following requirements:\n"
            + division.requirements
                .map(
                    (requirement, index) =>
                        `(${index + 1}) ${requirement.property} ${requirement.operator} ${requirement.value}`,
                )
                .join('\n'),
        );

        return;
    }

    if (!Array.isArray(division.requirements) || division.requirements.length === 0) {
        await message.channel.send("That division does not have any requirements.");

        return;
    }

    const requirement = division.requirements[Number.parseInt(options[2], 10) - 1];

    if (typeof requirement !== "object" || requirement === null) {
        await message.channel.send("No such requirement exists for that division.");

        return;
    }

    if (options[3] === "-") {
        division.requirements.splice(division.requirements.indexOf(requirement), 1);
        writeConfiguration(message.guild.id, configuration);
        await message.channel.send("Requirement deleted.");

        return;
    }

    await message.channel.send("Invalid configuration provided.");
};
