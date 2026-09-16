// buffer-engine.js
// Simulating a 12-byte legacy protocol: [4 bytes: Sequence] [4 bytes: SensorID] [4 bytes: Float Value]

class ZeroCopySlab {
    constructor(maxRecords = 100000) {
        this.recordSize = 12; // 12 bytes per packet
        this.maxRecords = maxRecords;
        
        // Pre-allocate a massive chunk of memory (Bypassing V8 Garbage Collection for per-packet allocation)
        this.slab = Buffer.allocUnsafe(this.maxRecords * this.recordSize);
        this.writePointer = 0;
    }

    // Ingest raw binary stream chunks without creating new objects
    ingest(rawBuffer) {
        let offset = 0;
        const length = rawBuffer.length;

        while (offset + this.recordSize <= length) {
            const slabOffset = this.writePointer * this.recordSize;
            
            // Zero-copy direct memory write
            rawBuffer.copy(this.slab, slabOffset, offset, offset + this.recordSize);
            
            // Move pointer, wrap around if we hit the end of the slab (Ring Buffer)
            this.writePointer = (this.writePointer + 1) % this.maxRecords;
            offset += this.recordSize;
        }
    }

    // Read the most recently written packet on-demand (O(1) lookup)
    getLatest() {
        // Find the last written record
        let readPointer = this.writePointer - 1;
        if (readPointer < 0) readPointer = this.maxRecords - 1;

        const offset = readPointer * this.recordSize;

        // Translate binary to JSON ONLY when queried (Lazy Translation)
        return {
            sequence: this.slab.readUInt32LE(offset),
            sensorId: this.slab.readUInt32LE(offset + 4),
            value: this.slab.readFloatLE(offset + 8).toFixed(4)
        };
    }
}

module.exports = ZeroCopySlab;