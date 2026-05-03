const axios = require('axios');

const omeApiUrl = process.env.OME_API_URL || 'http://192.168.1.107:8091';
const omeApiUser = process.env.OME_API_USERNAME || 'admin';
const omeApiPass = process.env.OME_API_PASSWORD || '123456789';
const vhost = process.env.OME_VHOST || 'default';
const app = process.env.OME_APP || 'app';
const stream = process.env.OME_STREAM || 'stream';

function getStats(req, res, next) {
  if (req.url !== '/api/stats') {
    return next();
  }

  const endpoint = `/v1/stats/current/vhosts/${vhost}/apps/${app}/streams/${stream}`;
  
  axios.get(`${omeApiUrl}${endpoint}`, {
    auth: {
      username: omeApiUser,
      password: omeApiPass,
    },
    timeout: 5000,
  })
  .then(response => {
    const stats = response.data.response;
    
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      data: {
        viewers: stats.connections.webrtc,
        bandwidthIn: {
          current: stats.lastThroughputIn,
          average: stats.avgThroughputIn,
          max: stats.maxThroughputIn,
        },
        bandwidthOut: {
          current: stats.lastThroughputOut,
          average: stats.avgThroughputOut,
          max: stats.maxThroughputOut,
        },
        totalBytesIn: stats.totalBytesIn,
        totalBytesOut: stats.totalBytesOut,
        connectionTime: stats.maxTotalConnectionTime,
        connectionTypes: stats.connections,
        lastUpdated: stats.lastUpdatedTime,
      },
    }));
  })
  .catch(error => {
    console.error('OME Stats Error:', error.message);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: error.message,
    }));
  });
}

module.exports = getStats;