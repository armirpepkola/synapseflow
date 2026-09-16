// server.js
const net = require('net');
const Fastify = require('fastify');
const mercurius = require('mercurius');
const ZeroCopySlab = require('./buffer-engine');

const bufferPool = new ZeroCopySlab();

// 1. TCP INGESTION SERVER (Legacy Feed)
const tcpServer = net.createServer((socket) => {
    socket.on('data', (chunk) => {
        // High-speed ingestion. Bypassing JS object creation.
        bufferPool.ingest(chunk);
    });
    socket.on('error', (err) => console.error('TCP Error:', err.message));
});

tcpServer.listen(9000, () => {
    console.log('🔌 SynapseFlow TCP Ingestion active on port 9000');
});


// 2. GRAPHQL API TRANSLATION LAYER
const app = Fastify({ logger: false });

const schema = `
  type Telemetry {
    sequence: Int!
    sensorId: Int!
    value: Float!
  }
  type Query {
    latestTelemetry: Telemetry
  }
`;

const resolvers = {
  Query: {
    latestTelemetry: () => {
        // Queries the buffer pool in real-time
        return bufferPool.getLatest(); 
    }
  }
};

app.register(mercurius, {
  schema,
  resolvers,
  graphiql: true
});

app.listen({ port: 3000, host: '0.0.0.0' }, (err) => {
  if (err) { console.error(err); process.exit(1); }
  console.log('🚀 SynapseFlow GraphQL Gateway active on http://localhost:3000/graphiql');
});