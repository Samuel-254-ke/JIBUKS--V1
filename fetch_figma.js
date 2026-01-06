const https = require('https');
const fs = require('fs');

const options = {
    hostname: 'api.figma.com',
    path: '/v1/files/eNQ37gNCQrLcR4d95RPY7E/nodes?ids=6524:1533',
    method: 'GET',
    headers: {
        'X-Figma-Token': process.env.FIGMA_TOKEN || ''
    }
};

const req = https.request(options, res => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
        fs.writeFileSync('figma_data_new.json', data);
        console.log('Data saved to figma_data_new.json');
    });
});

req.on('error', error => { console.error(error); });
req.end();
