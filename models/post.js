const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
    title: { type: String, required: true },
    body: { type: String, required: true },
    timestamp: { type: Date, required: true },
    username: { type: String, required: true}
});

module.exports = mongoose.model("Post", PostSchema);