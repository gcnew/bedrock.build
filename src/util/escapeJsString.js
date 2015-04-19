function escapeJsString(aString) {
	return aString
		.replace(/\\/g, '\\\\')
		.replace(/\'/g, '\\\'')
		.replace(/\r/g, '\\r')
		.replace(/\n/g, '\\n');
}
