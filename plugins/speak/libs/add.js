"use strict";

module.exports = function (arr, elem, max) {
	arr.splice(max - 1);
	arr.unshift(elem);
	return arr;
}