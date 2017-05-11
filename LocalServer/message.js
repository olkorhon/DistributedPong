function Message(sender_id, type, body) {
    const self = this;

    this.header = {
        sender_id: sender_id,
        type: type
    };
    this.body = body;

    this.toJson = function () {
        return JSON.stringify(self);
    }
}

module.exports = Message;