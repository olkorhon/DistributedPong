const CryptoJS = require('./aes.js');
const conf = require('./config.js');

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

function encrypt(data) {
    return CryptoJS.AES.encrypt(data, conf.AES_KEY).toString();
}

function decrypt(crypted_data) {
    var decrypted = CryptoJS.AES.decrypt(crypted_data, conf.AES_KEY).toString(CryptoJS.enc.Utf8);
    return decrypted;
}

module.exports = {
    Message: Message,
    encrypt: encrypt,
    decrypt: decrypt
};