"use strict";

const axios = require("axios").default;
const { Message, GuildMember } = require("discord.js");
const { readConfiguration } = require("./read-configuration");

const getGuildMember = (message, input) => {
    if (typeof input !== "string" || input.length === 0) {
        return null;
    }

    if (/<@!\d+>/.test(input)) {
        return message.guild.members.fetch(input.substr(3, input.length - 4));
    }

    if (/<@\d+>/.test(input)) {
        return message.guild.members.fetch(input.substr(2, input.length - 3));
    }

    if (/\d+/.test(input)) {
        return message.guild.members.fetch(input);
    }

    return null;
};

exports.check = async (message, options) => {
    if (!(message instanceof Message) || !Array.isArray(options)) {
        return;
    }

    const configuration = readConfiguration(message.guild.id);

    if (typeof configuration !== "object" || configuration === null) {
        await message.channel.send("This guild does not have any settings.");

        return;
    }

    if (!Array.isArray(configuration.divisions) || configuration.divisions.length === 0) {
        await message.channel.send("This guild does not have any divisions.");

        return;
    }

    if (options.length === 0) {
        await message.channel.send("No user ID provided.");

        return;
    }

    const member = await getGuildMember(message, options[0]);

    const playerResponse = member instanceof GuildMember
        ? await axios.get(`https://www.mkwlounge.gg/api/player.php?discord_user_id=${member.id}`)
        : await axios.get(`https://www.mkwlounge.gg/api/player.php?player_name=${options[0]}`);

    if (typeof playerResponse !== "object"
        || playerResponse === null
        || typeof playerResponse.data !== "object"
        || playerResponse.data === null
        || !Array.isArray(playerResponse.data.results)
        || typeof playerResponse.data.results[0] !== "object"
        || playerResponse.data.results[0] === null
        || !Number.isInteger(playerResponse.data.results[0].player_id)) {
        await message.channel.send("Player not found.");

        return;
    }

    const playerId = playerResponse.data.results[0].player_id;
    const userId = playerResponse.data.results[0].discord_user_id;
    const leaderboardResponse = await axios.get(
        `https://www.mkwlounge.gg/api/ladderplayer.php?ladder_id=1&player_id=${playerId}`,
    );

    if (typeof leaderboardResponse !== "object"
        || leaderboardResponse === null
        || typeof leaderboardResponse.data !== "object"
        || leaderboardResponse.data === null
        || !Array.isArray(leaderboardResponse.data.results)
        || typeof leaderboardResponse.data.results[0] !== "object"
        || leaderboardResponse.data.results[0] === null) {
        await message.channel.send("Leaderboard profile not found.");

        return;
    }

    const profile = leaderboardResponse.data.results[0];
    const roleIds = [];

    for (const division of configuration.divisions) {
        const belongsInDivision = !Array.isArray(division.requirements)
            || division.requirements.every(
                (requirement) => {
                    if (typeof requirement !== "object"
                        || requirement === null
                        || requirement.property !== "PEAKMMR"
                        || (requirement.operator !== ">=" && requirement.operator !== "<=")
                        || !Number.isInteger(requirement.value)) {
                        return true;
                    }

                    const value = profile.total_events < 10 ? profile.current_mmr : profile.peak_mmr;

                    return requirement.operator === ">=" ? value >= requirement.value : value <= requirement.value;
                },
            );

        if (belongsInDivision) {
            roleIds.push(division.roleId);
        }
    }

    await message.channel.send(
        {
            content: `<@${userId}> ${profile.player_name} ${roleIds.map((roleId) => `<@&${roleId}>`).join(", ")}`,
            allowedMentions: {
                parse: [],
            },
        },
    );
};
