const fs = require('fs');
const http = require('http');
const request = require('request');
const dateFormat = require('dateformat');
const Printer = require('./core/ipp-printer');
const ipp = require('ipp-encoder');
const myUtil = require('./core/util')();

const myConf = require('./config').conf;
const { logger } = require('./core/log');
const { json } = require('body-parser');

let requestingUserName;

const server = {
    // start printer server.
    run: (webServer) => {
        logger.debug(`Server run Info:\n ${JSON.stringify(myConf)}`);
        const curIp = myUtil.getip().ip;
        const conf = {
            name: myConf.name,
            port: myConf.port,
            uri: `http://${curIp}:${myConf.port}/printer`,
            zeroconf: true,
            server: http.createServer(),
        };
        logger.debug(`conf:\n ${JSON.stringify(conf)}`);

        const printer = new Printer(conf);
        printer.on('job', onJob);
        printer.on('operation', onOperation);
        printer.server.on('listening', () => {
            const { address, port } = conf.server.address();
            const curIp = myUtil.getip().ip;
            webServer(port).listen(conf.port);
            logger.info(`ipp-printer listening on: ${curIp}:${conf.port} (proxy: ${address}:${port})`);
        });

        // star proxy
        conf.server.listen(3000, 'localhost');
    },
};

async function onJob(job) {
    const driverType = 'ps';
    const config = myConf; // set global config data.

    logger.debug(`${requestingUserName} print job...`);
    const now = dateFormat(job.createdAt, 'yyyymmddHHMMss');
    const random = Math.random()
        .toString(36)
        .substring(2);
    const fileName = `job-${job.id}-${requestingUserName}-${now}-${random}`;

    let jobName = job.name.replace(/\s/g, '');
    const obj = {
        requestingUserName: `${requestingUserName}`,
        job_file: `${fileName}.${driverType}`,
        job_name: `(iprint-d)${jobName}`, // job name,

    };
    logger.info('job info: ', obj);

    const file = fs.createWriteStream(`${config.job_file_path}/${fileName}.${driverType}`);
    job.pipe(file).on('finish', async () => {
        logger.debug('printed');
    });

    const debugJob = (msg) => {
        logger.debug(`
        -- job --
        id: ${job.id}
        state: ${job.state} ${getJobStatus(job.state)}
        uri: ${job.uri}
        name: ${job.name}
        userName: ${job.userName}
        createdAt: ${job.createdAt}
        processingAt: ${job.processingAt}
        completedAt: ${job.completedAt}
        short: ${job.name.split(' ').pop()}
        ${msg}`);
    };
    job.on('end', () => debugJob('saved'));
    job.on('cancel', () => debugJob('cancel'));
    job.on('abort', () => debugJob('abort'));
    job.on('error', (err) => (debugJob(`error: ${err}`)));
}

function getJobStatus(v) {
    for (const k in ipp.CONSTANTS) {
        if (ipp.CONSTANTS[k] == v && k.match(/^JOB_/)) {
            return k;
        }
    }
    return `unknow ${v}`;
}

function getOperation(v) {
    const C = ipp.CONSTANTS;
    const opts = ['PRINT_JOB', 'VALIDATE_JOB', 'GET_JOBS', 'GET_PRINTER_ATTRIBUTES', 'CANCEL_JOB', 'GET_JOB_ATTRIBUTES'];
    for (let i = 0; i < opts.length; i++) {
        const k = opts[i];
        if (ipp.CONSTANTS[k] === v) {
            return k;
        }
    }
    return `unknow ${v}`;
}

function onOperation(op) {
    let group = op.groups;
    try {
        logger.debug('group=', JSON.stringify(group));
        if (group && group.length > 0 && group[0].attributes) {
            const attrs = group[0].attributes;
            logger.debug('attributes=', attrs);
            const printerUri = attrs.filter(g => g.name == 'printer-uri')[0];
            if (printerUri && printerUri.hasOwnProperty('value')) {
                const tmpAttr = attrs.filter(g => g.name === 'requesting-user-name')[0];
                if (tmpAttr) {
                    requestingUserName = tmpAttr.value[0];
                    logger.info(`requesting-user-name=${requestingUserName}`);
                }
            }
        }
    } catch (error) {
        logger.error('get printerName from attributes error. error=', error);
    }
    let jobName = '';
    if (group && group.length == 1) {
        group = group[0].attributes.map((g) => {
            const value = g.value.length == 1 ? g.value : `[${g.value.join(', ')}]`;
            if (g.name == 'job-name') {
                jobName = value;
            }
            return `${g.name}: ${value}`;
        }).join('\n');
    }

    // logger.debug('onOperation: ', JSON.stringify(op));
    logger.debug(`
        -- operation -- 
        operationId: ${op.operationId} ${getOperation(op.operationId)}
        requestId:: ${op.requestId}
        version:: ${op.version.major}.${op.version.minor}
        groups:
        ${group}`);
}

module.exports = server;
