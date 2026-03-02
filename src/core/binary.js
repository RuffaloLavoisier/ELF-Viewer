export class BinaryReader {
    constructor(data, { isLE, warn }) {
        this.data = data;
        this.view = new DataView(data.buffer);
        this.isLE = isLE;
        this.warn = warn || (() => {});
    }

    inRange(offset, size) {
        return offset >= 0 && size >= 0 && offset + size <= this.data.length;
    }

    u16(offset, label) {
        if (!this.inRange(offset, 2)) {
            this.warn(label + ' out of range at 0x' + offset.toString(16));
            return 0;
        }
        return this.view.getUint16(offset, this.isLE);
    }

    u32(offset, label) {
        if (!this.inRange(offset, 4)) {
            this.warn(label + ' out of range at 0x' + offset.toString(16));
            return 0;
        }
        return this.view.getUint32(offset, this.isLE);
    }

    u64(offset, label) {
        if (!this.inRange(offset, 8)) {
            this.warn(label + ' out of range at 0x' + offset.toString(16));
            return 0;
        }
        const lo = this.view.getUint32(offset + (this.isLE ? 0 : 4), this.isLE);
        const hi = this.view.getUint32(offset + (this.isLE ? 4 : 0), this.isLE);
        return hi * 4294967296 + lo;
    }
}
