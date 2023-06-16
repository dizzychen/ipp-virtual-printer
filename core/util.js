module.exports = (app) => {
    const logger = (app == null) ? null : app.locals.logger;
    const URL = require('url');
    const moment = require('moment');
    const querystring = require('querystring');
    const os = require('os');
    const crypto = require('crypto');

    if (!String.prototype.padStart) {
        String.prototype.padStart = function padStart(targetLength, padString) {
            targetLength = targetLength >> 0; // floor if number or convert non-number to 0;
            padString = String(padString || ' ');
            if (this.length > targetLength) {
                return String(this);
            } else {
                targetLength = targetLength - this.length;
                if (targetLength > padString.length) {
                    // append to original to ensure we are longer than needed
                    padString += padString.repeat(targetLength / padString.length);
                }
                return padString.slice(0, targetLength) + String(this);
            }
        };
    }

    const util = {
        isNumeric: (val) => !isNaN(val - parseFloat(val)),
        trimObj: (obj, recursive, nullFunc = (val) => val === undefined) => {
            if (obj != null) {
                if (recursive) {
                    const removeEmpty = (_obj) => {
                        Object.keys(_obj).forEach(key =>
                            (_obj[key] &&
                                typeof _obj[key] === 'object'
                            ) &&
                            removeEmpty(_obj[key]) ||
                            (nullFunc(_obj[key])) &&
                            delete _obj[key]);
                        return _obj;
                    };
                    obj = removeEmpty(obj);
                } else {
                    Object.keys(obj).forEach(key => nullFunc(obj[key]) ? delete obj[key] : '');
                }
            }
            return obj;
        },
        md5: (str) => {
            const md5Crypto = crypto.createHash('md5');
            return md5Crypto.update(str, 'utf8').digest('hex');
        },
        mask: (str) => {
            if (str) {
                return '*'.repeat(str.length);
            }
            return '[empty]';
        },
        makeHttpOption: (urlString) => {
            const url = URL.parse(urlString);
            return {
                protocal: url.protocol,
                host: url.host,
                port: url.port,
                path: url.path,
                timeout: 5000,
            };
        },
        makeUrl: (urldata = { url: '', queries: {} }, myqueries = {}, myhash = '') => {
            const { url } = urldata;
            let q = Object.assign({}, urldata.queries, myqueries);
            q = util.trimObj(q, true, val => (!val && !util.isNumeric(val)));

            const qs = querystring.stringify(q);

            let hash = myhash;
            if (!hash) {
                hash = urldata.hash;
            }

            let result = url;
            if (qs != null && qs != '') {
                result += `?${qs}`;
            }
            if (hash != null && hash != '') {
                result += `#${hash}`;
            }
            return result;
        },
        desEncrypt: (obj, key, iv) => {
            let plaintext = obj;
            if (typeof(plaintext) != 'string') {
                plaintext = JSON.stringify(obj);
            }
            key = key || '01234567';
            iv = new Buffer(iv ? iv : '00000000');
            // des加密
            const cipher = crypto.createCipheriv('des-cbc', key, iv);
            let ciph = cipher.update(plaintext, 'utf8', 'base64');
            ciph += cipher.final('base64');
            return ciph;
        },
        desDecrypt: (cipertext, key, iv) => {
            key = key || '01234567';
            iv = new Buffer(iv ? iv : '00000000');
            const decipher = crypto.createDecipheriv('des-cbc', key, iv);
            let txt = decipher.update(cipertext, 'base64', 'utf8');
            txt += decipher.final('utf8');
            return txt;
        },
        getip: (fetchall) => {
            const ifaces = os.networkInterfaces();

            const allresults = [];

            Object.keys(ifaces).forEach((ifname) => {
                let alias = 0;

                ifaces[ifname].forEach((iface) => {
                    if ('IPv4' !== iface.family || iface.internal !== false) {
                        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                        return;
                    }

                    if (alias >= 1) {
                        // this single interface has multiple ipv4 addresses
                        allresults.push({ ifname, alias, ip: iface.address });
                    } else {
                        // this interface has only one ipv4 adress
                        allresults.push({ ifname, ip: iface.address });
                    }
                    ++alias;
                });
            });

            if (fetchall) {
                return allresults;
            }
            return allresults.length > 0 ? allresults[0] : {};
        },
        checkhost: (urlstring, validHosts) => {
            if (!Array.isArray(validHosts)) {
                // 没有配置，就全部放开
                logger.warn(`checkhost allallow urlstring=${urlstring} valid_hosts=${validHosts}`);
                return true;
            }
            const urlobject = URL.parse(urlstring);
            if (urlobject && urlobject.host && urlobject.host != '' && validHosts.indexOf(urlobject.host) >= 0) {
                return true;
            }
            logger.warn(`checkhost false urlstring=${urlstring} valid_hosts=${validHosts}`);
            return false;
        },
        test: {
            now: (format) => moment().format(format),
            inspectObj: (obj) => {
                const result = {};
                if (obj != null) {
                    for (const key of Reflect.ownKeys(obj)) {
                        if (!key.startsWith('_')) {
                            result[key] = Object.getOwnPropertyDescriptor(obj, key);
                        }
                    }
                }
                return result;
            },
            makeString: (obj) => {
                if (obj == null || obj.toString == null) {
                    return '[null]';
                } else if (typeof obj.toString != 'function') {
                    return '[not function]';
                }
                return obj.toString();
            },
        },
    };
    return util;
};
