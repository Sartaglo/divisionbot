"use strict";

const fs = require("fs");

exports.readConfiguration = (guildId) => {
    const fileName = guildId + ".json";

    if (fs.existsSync(fileName)) {
        return JSON.parse(fs.readFileSync(fileName, { encoding: 'utf-8' }));
    }

    return null;
};
