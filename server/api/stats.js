import axios from 'axios';

export default async function (req, res) {
  try {
    const omeApiUrl = process.env.OME_API_URL || 'http://80.115.244.159:8091';
    const omeApiUser = process.env.OME_API_USERNAME || 'admin';
    const omeApiPass = process.env.OME_API_PASSWORD || '123456789';
    const vhost = process.env.OME_VHOST || 'default';
    const app = process.env.OME_APP || 'app';
    const stream = process.env.OME_STREAM || 'stream';

    const endpoint = `/v1/stats/current/vhosts/${vhost}/apps/${app}/streams/${stream}`;

    const response = await axios.get(`${omeApiUrl}${endpoint}`, {
      auth: {
        username: omeApiUser,
        password: omeApiPass,
      },
      timeout: 5000,
    });

    const stats = response.data.response;

    res.status(200).json({
      success: true,
      data: {
        viewers: stats.connections.webrtc,
        bandwidthIn: {
          current: stats.lastThroughputOut,
          average: stats.avgThroughputOut,
          max: stats.maxThroughputOut,
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
    });
  } catch (error) {
    console.error('OME Stats Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
