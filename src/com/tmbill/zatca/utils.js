

/**
 * Converts a tags array to a TLV string
 * @param {Tag[]} tags
 * @return {string}
 */
function toTlv(tags) {
    return tags.map(tag => tag.toTlv()).join('');
}


/**
 * Converts a tags array to a base64 string using the TLV encoding
 * @param {Tag[]} tags
 * @return {string} representing base64 of tags TLV
 */
function tagsToBase64(tags) {
    return Buffer.from(toTlv(tags)).toString('base64');
}


/**
 *  Convert a string to a hex string encoded with UTF-8
 * @param {number} value
 * @return {string}
 */
function toHex(value) {
    let hex = value.toString(16);

    if ((hex.length % 2) > 0) {
        hex = '0' + hex;
    }

    return Buffer
        .from(hex, 'hex')
        .toString('utf-8');
}


/**
 * Converts a string with utf8 encoding to a base64 string
 * @param {string} value with utf8 encoding
 * @return {string} representing base64
 */
function toBase64(value) {
    return Buffer.from(value).toString('base64');
}


const ZATCA_TAGS = {
    SELLER_NAME: 1,
    SELLER_TRN: 2,
    INVOICE_DATE: 3,
    INVOICE_TOTAL: 4,
    VAT_TOTAL: 5
}

module.exports = {
    ZATCA_TAGS,
    toBase64,
    toHex,
    toTlv,
    tagsToBase64
}
