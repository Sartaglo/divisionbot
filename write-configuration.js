"use strict";

const fs = require("fs");

exports.writeConfiguration = (guildId, configuration) => {
    fs.writeFileSync(
        guildId + ".json",
        JSON.stringify(configuration, null, 4),
    );
};
