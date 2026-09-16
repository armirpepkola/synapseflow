// generator.js
const net = require('net');

const client = new net.Socket();
client.connect(9000, '127.0.0.1', () => {
    console.log('Connected to SynapseFlow Gateway. Commencing data blast...');
    
    let sequence = 0;
    const packet = Buffer.allocUnsafe(12); // 12-byte payload

    // Blast 5,000 packets every 10 milliseconds
    setInterval(() => {
        for(let i = 0; i < 50; i++) {
            sequence++;
            packet.writeUInt32LE(sequence, 0); // Sequence
            packet.writeUInt32LE(Math.floor(Math.random() * 100), 4); // Sensor ID (0-99)
            packet.writeFloatLE(Math.random() * 1000, 8); // Random float value
            
            client.write(packet);
        }
    }, 10);
});

client.on('error', (err) => console.log('Wait for the server to start first!'));