Date.prototype.getWeek = function() {
	let now = this;
	let onejan = new Date(this.getFullYear(), 0, 1);
	return Math.ceil( (((now - onejan) / 86400000) + onejan.getDay() + 1) / 7 );
};