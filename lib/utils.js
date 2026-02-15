module.exports = {
    isAbsolute(command) {
        return command <= 90; // command <= 'Z'
    },
	toAbsolute(command) {
        if (this.isAbsolute(command)) {
            return command;
        }
		return command - 32;
	},
	toRelative(command) {
        if (!this.isAbsolute(command)) {
            return command;
        }
		return command + 32;
	},
};
