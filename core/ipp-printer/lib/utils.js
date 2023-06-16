const uconcat = require('unique-concat');
const C = require('ipp-encoder').CONSTANTS;

exports.time = time;
exports.getJobFromRequest = getJobFromRequest;
exports.getAttributesForGroup = getAttributesForGroup;
exports.getFirstValueForName = getFirstValueForName;
exports.requestedAttributes = requestedAttributes;
exports.removeStandardAttributes = removeStandardAttributes;
exports.expandAttrGroups = expandAttrGroups;

const ATTR_GROUPS = ['all', 'job-template', 'job-description', 'printer-description'];

const ATTR_GROUP_PRINTER_DESC = [
    'printer-uri-supported',
    'uri-security-supported',
    'uri-authentication-supported',
    'printer-name',
    'printer-location',
    'printer-info',
    'printer-more-info',
    'printer-driver-installer',
    'printer-make-and-model',
    'printer-more-info-manufacturer',
    'printer-state',
    'printer-state-reasons',
    'printer-state-message',
    'ipp-versions-supported',
    'operations-supported',
    'multiple-document-jobs-supported',
    'charset-configured',
    'charset-supported',
    'natural-language-configured',
    'generated-natural-language-supported',
    'document-format-default',
    'document-format-supported',
    'printer-is-accepting-jobs',
    'queued-job-count',
    'printer-message-from-operator',
    'color-supported',
    'reference-uri-schemes-supported',
    'pdl-override-supported',
    'printer-up-time',
    'printer-current-time',
    'multiple-operation-time-out',
    'compression-supported',
    'job-k-octets-supported',
    'job-impressions-supported',
    'job-media-sheets-supported',
    'pages-per-minute',
    'pages-per-minute-color'
];

const ATTR_GROUP_JOB_TMPL = [
    'job-priority',
    'job-hold-until',
    'job-sheets',
    'multiple-document-handling',
    'copies',
    'finishings',
    'page-ranges',
    'sides',
    'number-up',
    'orientation-requested',
    'media',
    'printer-resolution',
    'print-quality'
];

const ATTR_GROUP_JOB_DESC = [
    'job-uri',
    'job-id',
    'job-printer-uri',
    'job-more-info',
    'job-name',
    'job-originating-user-name',
    'job-state',
    'job-state-reasons',
    'job-state-message',
    'job-detailed-status-messages',
    'job-document-access-errors',
    'number-of-documents',
    'output-device-assigned',
    'time-at-creation',
    'time-at-processing',
    'time-at-completed',
    'job-printer-up-time',
    'date-time-at-creation',
    'date-time-at-processing',
    'date-time-at-completed',
    'number-of-intervening-jobs',
    'job-message-from-operator',
    'job-k-octets',
    'job-impressions',
    'job-media-sheets',
    'job-k-octets-processed',
    'job-impressions-completed',
    'job-media-sheets-completed',
    'attributes-charset',
    'attributes-natural-language'
];

function time(printer, ts) {
    if (ts === undefined) ts = Date.now();
    else ts = ts.getTime();
    return Math.floor((ts - printer.started) / 1000);
}

function getJobFromRequest(printer, req) {
    const attributes = getAttributesForGroup(req, C.OPERATION_ATTRIBUTES_TAG);
    const id = getFirstValueForName(attributes, 'job-id');
    return printer.getJob(id);
}

function getAttributesForGroup(req, tag) {
    const result = findOneByKey(req.groups, 'tag', tag);
    if (result) return result.attributes;
}

function getFirstValueForName(attributes, name) {
    const result = findOneByKey(attributes, 'name', name);
    if (result) return Array.isArray(result.value) ? result.value[0] : result.value;
}

function findOneByKey(arr, key, value) {
    for (let i = 0, l = arr.length; i < l; i++) {
        if (arr[i][key] === value) return arr[i];
    }
}

function requestedAttributes(req) {
    let result;
    req.groups.some(function(group) {
        if (group.tag === C.OPERATION_ATTRIBUTES_TAG) {
            group.attributes.some(function(attr) {
                if (attr.name === 'requested-attributes') {
                    result = attr.value;
                    return true;
                }
            });
            return true;
        }
    });
    return result;
}

function removeStandardAttributes(attrs) {
    return attrs.filter(function(attr) {
        return ~ATTR_GROUPS.indexOf(attr) ||
            ATTR_GROUP_JOB_TMPL.indexOf(attr) ||
            ATTR_GROUP_JOB_DESC.indexOf(attr) ||
            ATTR_GROUP_PRINTER_DESC.indexOf(attr);
    });
}

function expandAttrGroups(attrs) {
    if (~attrs.indexOf('job-template')) attrs = uconcat(attrs, ATTR_GROUP_JOB_TMPL);
    if (~attrs.indexOf('job-description')) attrs = uconcat(attrs, ATTR_GROUP_JOB_DESC);
    if (~attrs.indexOf('printer-description')) attrs = uconcat(attrs, ATTR_GROUP_PRINTER_DESC);
    return attrs;
}
