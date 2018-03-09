"use strict";

api.mongo.createCollection('users');
api.mongo.createCollection('chats');
api.mongo.createCollection('speaks');
api.db = {
	users: api.mongo.collection("users"),
	chats: api.mongo.collection("chats"),
	speaks: api.mongo.collection("speaks"),
};