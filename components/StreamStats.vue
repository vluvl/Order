<template>
  <div class="mt-4 bg-neutral-800 rounded-lg p-4">
    <h2 class="text-xl font-bold text-neutral-200 mb-4">Stream Statistics</h2>
    
    <div v-if="loading" class="text-center text-neutral-400 py-4">
      Loading statistics...
    </div>
    
    <div v-else-if="error" class="text-center text-red-400 py-4">
      Failed to load statistics: {{ error }}
    </div>
    
    <div v-else class="space-y-4">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-neutral-700 rounded p-3">
          <div class="text-neutral-400 text-sm">Viewers</div>
          <div class="text-2xl font-bold text-neutral-200">{{ stats.viewers }}</div>
        </div>
        <div class="bg-neutral-700 rounded p-3">
          <div class="text-neutral-400 text-sm">Bandwidth In</div>
          <div class="text-lg font-bold text-green-400">{{ formatBandwidth(stats.bandwidthIn.current) }}</div>
        </div>
        <div class="bg-neutral-700 rounded p-3">
          <div class="text-neutral-400 text-sm">Bandwidth Out</div>
          <div class="text-lg font-bold text-blue-400">{{ formatBandwidth(stats.bandwidthOut.current) }}</div>
        </div>
        <div class="bg-neutral-700 rounded p-3">
          <div class="text-neutral-400 text-sm">Connection Type</div>
          <div class="text-lg font-bold text-yellow-400">{{ getConnectionType() }}</div>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-neutral-700 rounded p-3">
          <div class="text-neutral-400 text-sm mb-2">Average Bandwidth In</div>
          <div class="text-lg font-bold text-green-400">{{ formatBandwidth(stats.bandwidthIn.average) }}</div>
        </div>
        <div class="bg-neutral-700 rounded p-3">
          <div class="text-neutral-400 text-sm mb-2">Average Bandwidth Out</div>
          <div class="text-lg font-bold text-blue-400">{{ formatBandwidth(stats.bandwidthOut.average) }}</div>
        </div>
      </div>
      
      <div class="bg-neutral-700 rounded p-4">
        <div class="flex justify-between items-center mb-4">
          <span class="text-neutral-400 text-sm">Bandwidth Graph (Last 60 seconds)</span>
          <span class="text-neutral-500 text-xs">{{ stats.lastUpdated }}</span>
        </div>
        <div class="flex items-end justify-between h-48 gap-1">
          <div
            v-for="(value, index) in bandwidthHistory"
            :key="index"
            class="flex-1 bg-blue-500 rounded-t transition-all duration-300"
            :style="{ height: calculateBarHeight(value) + '%' }"
            :title="formatBandwidth(value)"
          ></div>
        </div>
      </div>
      
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-neutral-400">Total Bytes In: </span>
          <span class="text-neutral-200">{{ formatBytes(stats.totalBytesIn) }}</span>
        </div>
        <div>
          <span class="text-neutral-400">Total Bytes Out: </span>
          <span class="text-neutral-200">{{ formatBytes(stats.totalBytesOut) }}</span>
        </div>
        <div>
          <span class="text-neutral-400">Max Connections: </span>
          <span class="text-neutral-200">{{ stats.data.connectionTypes.webrtc }}</span>
        </div>
        <div>
          <span class="text-neutral-400">Max Connection Time: </span>
          <span class="text-neutral-200">{{ formatConnectionTime(stats.connectionTime) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StreamStats',
  data() {
    return {
      stats: {
        viewers: 0,
        bandwidthIn: {
          current: 0,
          average: 0,
          max: 0,
        },
        bandwidthOut: {
          current: 0,
          average: 0,
          max: 0,
        },
        totalBytesIn: 0,
        totalBytesOut: 0,
        connectionTime: '',
        connectionTypes: {},
        lastUpdated: '',
      },
      bandwidthHistory: [],
      maxBandwidth: 10000000,
      loading: true,
      error: null,
      refreshInterval: null,
    };
  },
  async mounted() {
    if (process.client) {
      await this.fetchStats();
      
      this.refreshInterval = setInterval(() => {
        this.fetchStats();
      }, 5000);
    }
  },
  beforeDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  },
  methods: {
    async fetchStats() {
      try {
        const response = await this.$axios.$get('/api/stats');
        this.stats = response.data;
        
        const currentBandwidth = response.data.bandwidthOut.current;
        this.bandwidthHistory.push(currentBandwidth);
        if (this.bandwidthHistory.length > 60) {
          this.bandwidthHistory.shift();
        }
        
        const maxVal = Math.max(...this.bandwidthHistory, 1000000);
        this.maxBandwidth = Math.ceil(maxVal / 1000000) * 1000000;
        
        this.error = null;
      } catch (err) {
        console.error('Failed to fetch stats:', err);
        this.error = err.message || 'Failed to fetch statistics';
      } finally {
        this.loading = false;
      }
    },
    calculateBarHeight(value) {
      if (this.maxBandwidth === 0) return 0;
      return (value / this.maxBandwidth) * 100;
    },
    formatBandwidth(bytesPerSecond) {
      if (bytesPerSecond === 0) return '0 bps';
      if (bytesPerSecond >= 1000000000) {
        return (bytesPerSecond / 1000000000).toFixed(2) + ' Gbps';
      }
      if (bytesPerSecond >= 1000000) {
        return (bytesPerSecond / 1000000).toFixed(2) + ' Mbps';
      }
      if (bytesPerSecond >= 1000) {
        return (bytesPerSecond / 1000).toFixed(2) + ' Kbps';
      }
      return bytesPerSecond.toFixed(2) + ' bps';
    },
    formatBytes(bytes) {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    getConnectionType() {
      const types = this.stats.connectionTypes;
      const activeTypes = Object.entries(types)
        .filter(([_, count]) => count > 0)
        .map(([type]) => type.toUpperCase());
      return activeTypes.length > 0 ? activeTypes.join(', ') : 'None';
    },
    formatConnectionTime(timestamp) {
      if (!timestamp) return 'N/A';
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    },
  },
};
</script>

<style scoped>
.bg-neutral-700 {
  background-color: #333333;
}
</style>