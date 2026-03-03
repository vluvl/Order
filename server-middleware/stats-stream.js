const http = require('http');
const axios = require('axios');

const omeApiUrl = process.env.OME_API_URL || 'http://192.168.1.107:8091';
const omeApiUser = process.env.OME_API_USERNAME || 'admin';
const omeApiPass = process.env.OME_API_PASSWORD || '123456789';
const vhost = process.env.OME_VHOST || 'default';
const app = process.env.OME_APP || 'app';
const stream = process.env.OME_STREAM || 'stream';
const updateInterval = parseInt(process.env.STATS_UPDATE_INTERVAL) || 5000;

function streamStats(req, res) {
  if (req.url !== '/api/stats-stream') {
    return next();
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  let lastTimeout = null;

  const fetchAndSend = async () => {
    try {
      const endpoint = `/v1/stats/current/vhosts/${vhost}/apps/${app}/streams/${stream}`;
      
      const response = await axios.get(`${omeApiUrl}${endpoint}`, {
        auth: {
          username: omeApiUser,
          password: omeApiPass,
        },
        timeout: 5000,
      });

      const stats = response.data.response;
      
      const data = {
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
        updateRate: updateInterval / 1000,
      };

      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error('OME Stats Error:', error.message);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    }

    lastTimeout = setTimeout(fetchAndSend, updateInterval);
  };

  req.on('close', () => {
    if (lastTimeout) {
      clearTimeout(lastTimeout);
    }
    res.end();
  });

  fetchAndSend();
}

module.exports = streamStats;