"use strict";

var text = `да хуйня, как сводили, так и сводят`;

text = text.replace(/\n/g, ' ').replace(/[^а-я0-9\. ]/ig, '').trim()

var dict = {}
var arr = text.split(' ');
var start = arr[0];
var end = arr[arr.length - 1];

arr.forEach((e, i) => {
	dict[e] = dict[e] || [];
	if(arr[i + 1]) dict[e].push(arr[i + 1].trim());
});

function rand(arr){
	let rnd = Math.random() * (arr.length) >> 0;
	return arr[rnd];
}


let out = [];
Object.keys(dict).forEach(e => {
	let txt = rand(dict[e]);
	if(txt) out.push(txt)

})

out.unshift(start);
//out.push(end)
console.log(out.join(' '))