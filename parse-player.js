"use strict";

const axios = require("axios").default;
const { GuildMember, Guild } = require("discord.js");

const getGuildMember = (guild, input) => {
    if (typeof input !== "string" || input.length === 0) {
        return null;
    }

    if (/^<@!\d+>$/.test(input)) {
        return guild.members.fetch(input.substr(3, input.length - 4));
    }

    if (/^<@\d+>$/.test(input)) {
        return guild.members.fetch(input.substr(2, input.length - 3));
    }

    if (/^\d+$/.test(input)) {
        return guild.members.fetch(input);
    }

    return null;
};

exports.parsePlayer = async (guild, configuration, input) => {
    if (!(guild instanceof Guild) || typeof input !== "string" || input.length === 0) {
        return { userId: null, playerName: null, userRoles: null };
    }

    const member = await getGuildMember(guild, input);
    const playerResponse = member instanceof GuildMember
        ? await axios.get(`https://www.mkwlounge.gg/api/player.php?discord_user_id=${member.user.id}`)
        : await axios.get(`https://www.mkwlounge.gg/api/player.php?player_name=${input}`);

    if (typeof playerResponse !== "object"
        || playerResponse === null
        || typeof playerResponse.data !== "object"
        || playerResponse.data === null
        || !Array.isArray(playerResponse.data.results)
        || typeof playerResponse.data.results[0] !== "object"
        || playerResponse.data.results[0] === null
        || !Number.isInteger(playerResponse.data.results[0].player_id)) {
        return { userId: null, playerName: null, userRoles: null };
    }

    const playerId = playerResponse.data.results[0].player_id;
    const playerName = playerResponse.data.results[0].player_name;
    const userId = `${playerResponse.data.results[0].discord_user_id}`;
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
        return { userId: null, playerName: null, userRoles: null };
    }

    const profile = leaderboardResponse.data.results[0];
    const userRoles = [];

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
        userRoles.push({ roleId: division.roleId, belongsInDivision });
    }

    return { userId, playerName, userRoles };
};
