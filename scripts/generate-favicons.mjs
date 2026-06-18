import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const staticDir = join(root, "static");

const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let k = 0; k < 8; k++) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        table[i] = c;
    }
    return table;
})();

const crc32 = (buffer) => {
    let crc = 0xffffffff;
    for (let i = 0; i < buffer.length; i++) {
        crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
};

const pngChunk = (type, data) => {
    const typeBuf = Buffer.from(type);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const checksum = Buffer.alloc(4);
    checksum.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
    return Buffer.concat([length, typeBuf, data, checksum]);
};

const circlePng = (size, r, g, b) => {
    const rowLength = 1 + size * 4;
    const raw = Buffer.alloc(rowLength * size);
    const center = size / 2;
    const radius = size / 2;

    for (let y = 0; y < size; y++) {
        const rowOffset = y * rowLength;
        raw[rowOffset] = 0;
        for (let x = 0; x < size; x++) {
            const px = rowOffset + 1 + x * 4;
            const dist = Math.hypot(x + 0.5 - center, y + 0.5 - center);
            let alpha = 0;

            if (dist <= radius - 0.5) {
                alpha = 255;
            } else if (dist < radius + 0.5) {
                alpha = Math.round((radius + 0.5 - dist) * 255);
            }

            raw[px] = r;
            raw[px + 1] = g;
            raw[px + 2] = b;
            raw[px + 3] = alpha;
        }
    }

    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(size, 0);
    ihdr.writeUInt32BE(size, 4);
    ihdr[8] = 8;
    ihdr[9] = 6;
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = 0;

    return Buffer.concat([
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        pngChunk("IHDR", ihdr),
        pngChunk("IDAT", deflateSync(raw)),
        pngChunk("IEND", Buffer.alloc(0)),
    ]);
};

const parseHexColor = (color) => {
    const hex = color.replace("#", "");
    return {
        r: Number.parseInt(hex.slice(0, 2), 16),
        g: Number.parseInt(hex.slice(2, 4), 16),
        b: Number.parseInt(hex.slice(4, 6), 16),
    };
};

const collectColors = () => {
    const colors = new Set();
    const dirs = [
        join(root, "content/competences"),
        join(root, "content/aspects"),
    ];

    for (const dir of dirs) {
        for (const file of readdirSync(dir)) {
            if (!file.endsWith(".json")) continue;
            const data = JSON.parse(readFileSync(join(dir, file), "utf8"));
            if (typeof data.color === "string") colors.add(data.color.toUpperCase());
        }
    }

    return [...colors].sort();
};

const writePng = (path, size, color) => {
    const { r, g, b } = parseHexColor(color);
    writeFileSync(path, circlePng(size, r, g, b));
};

const colors = collectColors();
const faviconDir32 = join(staticDir, "favicons/32");
const faviconDir180 = join(staticDir, "favicons/180");

mkdirSync(faviconDir32, { recursive: true });
mkdirSync(faviconDir180, { recursive: true });

for (const color of colors) {
    const id = color.replace("#", "");
    writePng(join(faviconDir32, `${id}.png`), 32, color);
    writePng(join(faviconDir180, `${id}.png`), 180, color);
}

const defaultColor = colors.includes("#87E8F7") ? "#87E8F7" : colors[0];
writePng(join(staticDir, "favicon.png"), 32, defaultColor);
writePng(join(staticDir, "apple-touch-icon.png"), 180, defaultColor);

console.log(`Generated ${colors.length} favicon colors.`);
