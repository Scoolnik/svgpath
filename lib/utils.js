export function isAbsolute(command) {
	return command <= 90; // command <= 'Z'
}

export function toAbsolute(command) {
	if (isAbsolute(command)) {
		return command;
	}
	return command - 32;
}

export function toRelative(command) {
	if (!isAbsolute(command)) {
		return command;
	}
	return command + 32;
}
