const { toHex } = require("./utils");

class Tag {
    constructor(tag, value) {
        this.tag = tag;
        this.value = value;
    }


    /**
     * Returns the tlv representation of the tag
     * @return {string}
     */
    toTlv() {
        return toHex(this.tag) + toHex(Buffer.byteLength(this.value)) + this.value;
    }

}

module.exports = {
    Tag
}