const util = require('util');
const os = require('os');
const http = require('http');
const Bonjour = require('bonjour');
const ipp = require('ipp-encoder');
const groups = require('./groups');
const operations = require('./operations');
const { logger } = require('../../../core/log.js');

const C = ipp.CONSTANTS;

module.exports = function (printer) {
    let server = printer.server;
    const bonjour = Bonjour();

    if (server) {
        server.on('request', onrequest);
        if (server.address()) onlistening();
        else server.on('listening', onlistening);
    } else {
        server = printer.server = http.createServer(onrequest);
        server.listen(printer.port, onlistening);
    }

    return printer;

    function onrequest(req, res) {
        // logger.debug('HTTP request: %s %s', req.method, req.url);

        if (req.method !== 'POST') {
            res.writeHead(405);
            res.end();
            return;
        } else if (req.headers['content-type'] !== 'application/ipp') {
            res.writeHead(400);
            res.end();
            return;
        }

        req.on('data', consumeAttrGroups);
        req.on('end', fail);

        function consumeAttrGroups(chunk) {
            req._body = req._body ? Buffer.concat([req._body, chunk]) : chunk;

            try {
                req._body = ipp.request.decode(req._body);
            } catch (e) {
                // logger.debug('incomplete IPP body - waiting for more data...');
                return;
            }

            req.removeListener('data', consumeAttrGroups);
            req.removeListener('end', fail);

            printer.emit('operation', req._body);
            router(printer, req, res);
        }

        function fail() {
            // decode only the most essential part of the IPP request header to allow
            // best possible response
            if (req._body.length >= 8) {
                const body = {
                    version: { major: req._body.readInt8(0), minor: req._body.readInt8(1) },
                    operationId: req._body.readInt16BE(2),
                    requestId: req._body.readInt32BE(4)
                };
            }
            send(printer, body, res, C.CLIENT_ERROR_BAD_REQUEST);
        }
    }

    function onlistening() {
        printer.port = server.address().port;

        if (!printer.uri) printer.uri = 'ipp://' + os.hostname() + ':' + printer.port + '/';

        logger.debug('printer "%s" is listening on %s', printer.name, printer.uri);
        printer.start();

        if (printer._zeroconf) {
            logger.debug('hostname: %s', os.hostname)
            logger.debug('advertising printer "%s" on network on port %s', printer.name, printer.port);
            bonjour.publish({ type: 'ipp', port: printer.port, name: printer.name });
        }
    }
};

function router(printer, req, res) {
    const body = req._body;

    logger.debug('IPP/%d.%d operation %d (request #%d)',
        body.version.major,
        body.version.minor,
        body.operationId,
        body.requestId,
        util.inspect(body.groups, { depth: null }));

    res.send = send.bind(null, printer, body, res);

    if (body.version.major !== 1) return res.send(C.SERVER_ERROR_VERSION_NOT_SUPPORTED);

    switch (body.operationId) {
        // Printer Operations
        case C.PRINT_JOB:
            return operations.printJob(printer, req, res);
        case C.VALIDATE_JOB:
            return operations.validateJob(printer, req, res);
        case C.GET_PRINTER_ATTRIBUTES:
            return operations.getPrinterAttributes(printer, req, res);
        case C.GET_JOBS:
            return operations.getJobs(printer, req, res);

        // Job Operations
        case C.CANCEL_JOB:
            return operations.cancelJob(printer, req, res);
        case C.GET_JOB_ATTRIBUTES:
            return operations.getJobAttributes(printer, req, res);

        default:
            res.send(C.SERVER_ERROR_OPERATION_NOT_SUPPORTED);
    }
}

function send(printer, req, res, statusCode, _groups) {
    if (typeof statusCode === 'object') return send(printer, req, res, C.SUCCESSFUL_OK, statusCode);
    if (statusCode === undefined) statusCode = C.SUCCESSFUL_OK;

    const obj = {};
    if (printer.fallback && req && req.version.major === 1 && req.version.minor === 0) obj.version = { major: 1, minor: 0 };
    obj.statusCode = statusCode;
    obj.requestId = req ? req.requestId : 0;
    obj.groups = [groups.operationAttributesTag(ipp.STATUS_CODES[statusCode])];
    if (_groups) obj.groups = obj.groups.concat(_groups);

    // logger.debug('responding to request #%d', obj.requestId, util.inspect(obj, { depth: null }));

    const buf = ipp.response.encode(obj);

    res.writeHead(200, {
        'Content-Length': buf.length,
        'Content-Type': 'application/ipp'
    });

    res.end(buf);
}
