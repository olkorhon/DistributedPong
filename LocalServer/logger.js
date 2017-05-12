function log(msg, is_silenced = false) {
    if (!is_silenced) {
        const now = new Date();
        const datestring = ("0" + now.getDate()).slice(-2) + "-"
            + ("0" + (now.getMonth() + 1)).slice(-2) + "-"
            + now.getFullYear() + " "
            + ("0" + now.getHours().toString()).slice(-2) + ":"
            + ("0" + now.getMinutes().toString()).slice(-2) + ":"
            + ("0" + now.getSeconds().toString()).slice(-2) + ":"
            + ("00" + now.getMilliseconds().toString()).slice(-3);

        console.log(datestring + ': ' + msg);
    }
}

module.exports = { log: log };