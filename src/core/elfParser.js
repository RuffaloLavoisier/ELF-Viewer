import { BinaryReader } from './binary.js';
import { sleep } from '../utils/async.js';
import { formatBytes } from '../utils/format.js';
import {
    getElfType,
    getMachine,
    getOSABI,
    getSectionFlags,
    getSectionType,
    getSegmentFlags,
    getSegmentType,
    getSymbolSection
} from '../domain/elf-constants.js';

const ELF_HEADER_SIZE_32 = 52;
const ELF_HEADER_SIZE_64 = 64;

function readStr(data, offset) {
    let s = '';
    for (let i = offset; i < data.length && data[i] !== 0; i++) {
        s += String.fromCharCode(data[i]);
    }
    return s;
}

export async function parseELFAsync(data, onProgress) {
    const warnings = [];
    const warn = (msg) => warnings.push(msg);
    const progress = async (percent, step) => {
        if (onProgress) onProgress(percent, step);
        await sleep(50);
    };

    if (data.length < 16) throw new Error('File too small for ELF header');
    if (data[0] !== 0x7f || data[1] !== 0x45 || data[2] !== 0x4c || data[3] !== 0x46) throw new Error('Not ELF');

    const is64 = data[4] === 2;
    const isLE = data[5] === 1;
    const reader = new BinaryReader(data, { isLE, warn });

    if (data.length < (is64 ? ELF_HEADER_SIZE_64 : ELF_HEADER_SIZE_32)) warn('ELF header appears truncated');

    const hdr = { is64, isLE, fields: [], machine: reader.u16(18, 'e_machine') };
    hdr.fields.push({ name: 'Magic', value: Array.from(data.slice(0, 4)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '), offset: 0, size: 4 });
    hdr.fields.push({ name: 'Class', value: is64 ? 'ELF64' : 'ELF32', offset: 4, size: 1 });
    hdr.fields.push({ name: 'Data', value: isLE ? 'Little Endian' : 'Big Endian', offset: 5, size: 1 });
    hdr.fields.push({ name: 'Version', value: data[6], offset: 6, size: 1 });
    hdr.fields.push({ name: 'OS/ABI', value: getOSABI(data[7]), offset: 7, size: 1 });
    hdr.fields.push({ name: 'ABI Version', value: data[8], offset: 8, size: 1 });
    hdr.fields.push({ name: 'Padding', value: Array.from(data.slice(9, 16)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '), offset: 9, size: 7 });
    hdr.type = reader.u16(16, 'e_type');
    hdr.fields.push({ name: 'Type', value: getElfType(hdr.type), offset: 16, size: 2 });
    hdr.fields.push({ name: 'Machine', value: getMachine(hdr.machine), offset: 18, size: 2 });

    if (is64) {
        hdr.entry = reader.u64(24, 'e_entry');
        hdr.phoff = reader.u64(32, 'e_phoff');
        hdr.shoff = reader.u64(40, 'e_shoff');
        hdr.phnum = reader.u16(56, 'e_phnum');
        hdr.shnum = reader.u16(60, 'e_shnum');
        hdr.shstrndx = reader.u16(62, 'e_shstrndx');
        hdr.phentsize = reader.u16(54, 'e_phentsize');
        hdr.shentsize = reader.u16(58, 'e_shentsize');
        hdr.fields.push({ name: 'Entry Point', value: '0x' + hdr.entry.toString(16), offset: 24, size: 8 });
        hdr.fields.push({ name: 'Program Header Offset', value: '0x' + hdr.phoff.toString(16), offset: 32, size: 8 });
        hdr.fields.push({ name: 'Section Header Offset', value: '0x' + hdr.shoff.toString(16), offset: 40, size: 8 });
        hdr.fields.push({ name: 'Flags', value: '0x' + reader.u32(48, 'e_flags').toString(16), offset: 48, size: 4 });
        hdr.fields.push({ name: 'ELF Header Size', value: reader.u16(52, 'e_ehsize') + ' bytes', offset: 52, size: 2 });
        hdr.fields.push({ name: 'Program Header Size', value: hdr.phentsize + ' bytes', offset: 54, size: 2 });
        hdr.fields.push({ name: 'Program Header Count', value: hdr.phnum, offset: 56, size: 2 });
        hdr.fields.push({ name: 'Section Header Size', value: hdr.shentsize + ' bytes', offset: 58, size: 2 });
        hdr.fields.push({ name: 'Section Header Count', value: hdr.shnum, offset: 60, size: 2 });
        hdr.fields.push({ name: 'Section Name String Index', value: hdr.shstrndx, offset: 62, size: 2 });
    } else {
        hdr.entry = reader.u32(24, 'e_entry');
        hdr.phoff = reader.u32(28, 'e_phoff');
        hdr.shoff = reader.u32(32, 'e_shoff');
        hdr.phnum = reader.u16(44, 'e_phnum');
        hdr.shnum = reader.u16(48, 'e_shnum');
        hdr.shstrndx = reader.u16(50, 'e_shstrndx');
        hdr.phentsize = reader.u16(42, 'e_phentsize');
        hdr.shentsize = reader.u16(46, 'e_shentsize');
        hdr.fields.push({ name: 'Entry Point', value: '0x' + hdr.entry.toString(16), offset: 24, size: 4 });
        hdr.fields.push({ name: 'Program Header Offset', value: '0x' + hdr.phoff.toString(16), offset: 28, size: 4 });
        hdr.fields.push({ name: 'Section Header Offset', value: '0x' + hdr.shoff.toString(16), offset: 32, size: 4 });
        hdr.fields.push({ name: 'Flags', value: '0x' + reader.u32(36, 'e_flags').toString(16), offset: 36, size: 4 });
        hdr.fields.push({ name: 'ELF Header Size', value: reader.u16(40, 'e_ehsize') + ' bytes', offset: 40, size: 2 });
        hdr.fields.push({ name: 'Program Header Size', value: hdr.phentsize + ' bytes', offset: 42, size: 2 });
        hdr.fields.push({ name: 'Program Header Count', value: hdr.phnum, offset: 44, size: 2 });
        hdr.fields.push({ name: 'Section Header Size', value: hdr.shentsize + ' bytes', offset: 46, size: 2 });
        hdr.fields.push({ name: 'Section Header Count', value: hdr.shnum, offset: 48, size: 2 });
        hdr.fields.push({ name: 'Section Name String Index', value: hdr.shstrndx, offset: 50, size: 2 });
    }

    const expectedPhEnt = is64 ? 56 : 32;
    const expectedShEnt = is64 ? 64 : 40;
    if (hdr.phentsize && hdr.phentsize !== expectedPhEnt) warn('Unexpected program header entry size: ' + hdr.phentsize + ' (expected ' + expectedPhEnt + ')');
    if (hdr.shentsize && hdr.shentsize !== expectedShEnt) warn('Unexpected section header entry size: ' + hdr.shentsize + ' (expected ' + expectedShEnt + ')');

    let phnum = hdr.phnum;
    let shnum = hdr.shnum;
    let shstrndx = hdr.shstrndx;
    const sh0off = hdr.shoff;
    if (hdr.shoff && hdr.shentsize && reader.inRange(sh0off, hdr.shentsize)) {
        const sh0size = is64 ? reader.u64(sh0off + 32, 'sh0.sh_size') : reader.u32(sh0off + 20, 'sh0.sh_size');
        const sh0link = is64 ? reader.u32(sh0off + 40, 'sh0.sh_link') : reader.u32(sh0off + 24, 'sh0.sh_link');
        const sh0info = is64 ? reader.u32(sh0off + 44, 'sh0.sh_info') : reader.u32(sh0off + 28, 'sh0.sh_info');
        if (hdr.shnum === 0 && sh0size) {
            shnum = sh0size;
            warn('e_shnum is 0, using section header 0 sh_size as section count');
            hdr.fields.push({ name: 'Section Header Count (extended)', value: shnum, offset: sh0off + (is64 ? 32 : 20), size: is64 ? 8 : 4 });
        }
        if (hdr.phnum === 0xffff && sh0info) {
            phnum = sh0info;
            warn('e_phnum is 0xffff, using section header 0 sh_info as program header count');
            hdr.fields.push({ name: 'Program Header Count (extended)', value: phnum, offset: sh0off + (is64 ? 44 : 28), size: 4 });
        }
        if (hdr.shstrndx === 0xffff && sh0link) {
            shstrndx = sh0link;
            warn('e_shstrndx is 0xffff, using section header 0 sh_link as string table index');
            hdr.fields.push({ name: 'Section Name String Index (extended)', value: shstrndx, offset: sh0off + (is64 ? 40 : 24), size: 4 });
        }
    } else if ((hdr.shnum === 0 || hdr.phnum === 0xffff || hdr.shstrndx === 0xffff) && hdr.shoff) {
        warn('Unable to read section header 0 for extended numbering');
    }
    hdr.phnum = phnum;
    hdr.shnum = shnum;
    hdr.shstrndx = shstrndx;

    await progress(40, 'Parsing section headers...');

    let strd = new Uint8Array(0);
    if (!hdr.shoff || !hdr.shentsize || hdr.shnum === 0) {
        warn('Section header table not present');
    } else if (hdr.shstrndx >= hdr.shnum) {
        warn('Section name string table index out of range');
    } else {
        const sho = hdr.shoff + hdr.shstrndx * hdr.shentsize;
        if (!reader.inRange(sho, hdr.shentsize)) {
            warn('Section name string table header out of range');
        } else if (is64) {
            const so = reader.u64(sho + 24, 'shstrtab.sh_offset');
            const ss = reader.u64(sho + 32, 'shstrtab.sh_size');
            if (reader.inRange(so, ss)) strd = data.slice(so, so + ss);
            else warn('Section name string table out of range');
        } else {
            const so = reader.u32(sho + 16, 'shstrtab.sh_offset');
            const ss = reader.u32(sho + 20, 'shstrtab.sh_size');
            if (reader.inRange(so, ss)) strd = data.slice(so, so + ss);
            else warn('Section name string table out of range');
        }
    }

    const phs = [];
    if (hdr.phnum > 0) {
        if (!hdr.phoff) warn('Program header offset is 0 but header count is non-zero');
        const maxPh = (hdr.phoff && hdr.phentsize && hdr.phoff < data.length) ? Math.floor((data.length - hdr.phoff) / hdr.phentsize) : 0;
        const phCount = Math.min(hdr.phnum, maxPh);
        if (phCount < hdr.phnum) warn('Program header count exceeds file bounds, truncating to ' + phCount);
        for (let i = 0; i < phCount; i++) {
            const o = hdr.phoff + i * hdr.phentsize;
            if (!reader.inRange(o, hdr.phentsize)) {
                warn('Program header #' + i + ' out of range');
                break;
            }
            const ph = { fields: [], index: i };
            if (is64) {
                ph.type = reader.u32(o, 'p_type');
                ph.flags = reader.u32(o + 4, 'p_flags');
                ph.offset = reader.u64(o + 8, 'p_offset');
                ph.vaddr = reader.u64(o + 16, 'p_vaddr');
                ph.paddr = reader.u64(o + 24, 'p_paddr');
                ph.filesz = reader.u64(o + 32, 'p_filesz');
                ph.memsz = reader.u64(o + 40, 'p_memsz');
                ph.align = reader.u64(o + 48, 'p_align');
                ph.fields.push({ name: 'Type', value: getSegmentType(ph.type), offset: o, size: 4 });
                ph.fields.push({ name: 'Flags', value: getSegmentFlags(ph.flags), offset: o + 4, size: 4 });
                ph.fields.push({ name: 'File Offset', value: '0x' + ph.offset.toString(16), offset: o + 8, size: 8 });
                ph.fields.push({ name: 'Virtual Address', value: '0x' + ph.vaddr.toString(16), offset: o + 16, size: 8 });
                ph.fields.push({ name: 'Physical Address', value: '0x' + ph.paddr.toString(16), offset: o + 24, size: 8 });
                ph.fields.push({ name: 'File Size', value: formatBytes(ph.filesz), offset: o + 32, size: 8 });
                ph.fields.push({ name: 'Memory Size', value: formatBytes(ph.memsz), offset: o + 40, size: 8 });
                ph.fields.push({ name: 'Alignment', value: '0x' + ph.align.toString(16), offset: o + 48, size: 8 });
            } else {
                ph.type = reader.u32(o, 'p_type');
                ph.offset = reader.u32(o + 4, 'p_offset');
                ph.vaddr = reader.u32(o + 8, 'p_vaddr');
                ph.paddr = reader.u32(o + 12, 'p_paddr');
                ph.filesz = reader.u32(o + 16, 'p_filesz');
                ph.memsz = reader.u32(o + 20, 'p_memsz');
                ph.flags = reader.u32(o + 24, 'p_flags');
                ph.align = reader.u32(o + 28, 'p_align');
                ph.fields.push({ name: 'Type', value: getSegmentType(ph.type), offset: o, size: 4 });
                ph.fields.push({ name: 'File Offset', value: '0x' + ph.offset.toString(16), offset: o + 4, size: 4 });
                ph.fields.push({ name: 'Virtual Address', value: '0x' + ph.vaddr.toString(16), offset: o + 8, size: 4 });
                ph.fields.push({ name: 'Physical Address', value: '0x' + ph.paddr.toString(16), offset: o + 12, size: 4 });
                ph.fields.push({ name: 'File Size', value: formatBytes(ph.filesz), offset: o + 16, size: 4 });
                ph.fields.push({ name: 'Memory Size', value: formatBytes(ph.memsz), offset: o + 20, size: 4 });
                ph.fields.push({ name: 'Flags', value: getSegmentFlags(ph.flags), offset: o + 24, size: 4 });
                ph.fields.push({ name: 'Alignment', value: '0x' + ph.align.toString(16), offset: o + 28, size: 4 });
            }
            if (ph.filesz > 0) {
                if (reader.inRange(ph.offset, ph.filesz)) {
                    ph.dataPreview = Array.from(data.slice(ph.offset, ph.offset + Math.min(ph.filesz, 64)));
                } else {
                    warn('Program header #' + i + ' data range out of file bounds');
                }
            }
            phs.push(ph);
        }
    }

    const secs = [];
    if (hdr.shnum > 0) {
        if (!hdr.shoff) warn('Section header offset is 0 but header count is non-zero');
        const maxSh = (hdr.shoff && hdr.shentsize && hdr.shoff < data.length) ? Math.floor((data.length - hdr.shoff) / hdr.shentsize) : 0;
        const shCount = Math.min(hdr.shnum, maxSh);
        if (shCount < hdr.shnum) warn('Section header count exceeds file bounds, truncating to ' + shCount);
        for (let i = 0; i < shCount; i++) {
            const o = hdr.shoff + i * hdr.shentsize;
            if (!reader.inRange(o, hdr.shentsize)) {
                warn('Section header #' + i + ' out of range');
                break;
            }
            const s = { fields: [], index: i };
            if (is64) {
                s.nameIdx = reader.u32(o, 'sh_name');
                s.type = reader.u32(o + 4, 'sh_type');
                s.flags = reader.u64(o + 8, 'sh_flags');
                s.addr = reader.u64(o + 16, 'sh_addr');
                s.offset = reader.u64(o + 24, 'sh_offset');
                s.size = reader.u64(o + 32, 'sh_size');
                s.link = reader.u32(o + 40, 'sh_link');
                s.info = reader.u32(o + 44, 'sh_info');
                s.addralign = reader.u64(o + 48, 'sh_addralign');
                s.entsize = reader.u64(o + 56, 'sh_entsize');
                s.name = (strd.length > 0 && s.nameIdx < strd.length) ? readStr(strd, s.nameIdx) : '';
                if (strd.length > 0 && s.nameIdx >= strd.length) warn('Section name string offset 0x' + s.nameIdx.toString(16) + ' out of range');
                s.fields.push({ name: 'Name', value: s.name || '(empty)', offset: o, size: 4 });
                s.fields.push({ name: 'Type', value: getSectionType(s.type), offset: o + 4, size: 4 });
                s.fields.push({ name: 'Flags', value: getSectionFlags(s.flags), offset: o + 8, size: 8 });
                s.fields.push({ name: 'Address', value: '0x' + s.addr.toString(16), offset: o + 16, size: 8 });
                s.fields.push({ name: 'File Offset', value: '0x' + s.offset.toString(16), offset: o + 24, size: 8 });
                s.fields.push({ name: 'Size', value: formatBytes(s.size), offset: o + 32, size: 8 });
                s.fields.push({ name: 'Link', value: s.link, offset: o + 40, size: 4 });
                s.fields.push({ name: 'Info', value: s.info, offset: o + 44, size: 4 });
                s.fields.push({ name: 'Alignment', value: s.addralign, offset: o + 48, size: 8 });
                s.fields.push({ name: 'Entry Size', value: s.entsize, offset: o + 56, size: 8 });
            } else {
                s.nameIdx = reader.u32(o, 'sh_name');
                s.type = reader.u32(o + 4, 'sh_type');
                s.flags = reader.u32(o + 8, 'sh_flags');
                s.addr = reader.u32(o + 12, 'sh_addr');
                s.offset = reader.u32(o + 16, 'sh_offset');
                s.size = reader.u32(o + 20, 'sh_size');
                s.link = reader.u32(o + 24, 'sh_link');
                s.info = reader.u32(o + 28, 'sh_info');
                s.addralign = reader.u32(o + 32, 'sh_addralign');
                s.entsize = reader.u32(o + 36, 'sh_entsize');
                s.name = (strd.length > 0 && s.nameIdx < strd.length) ? readStr(strd, s.nameIdx) : '';
                if (strd.length > 0 && s.nameIdx >= strd.length) warn('Section name string offset 0x' + s.nameIdx.toString(16) + ' out of range');
                s.fields.push({ name: 'Name', value: s.name || '(empty)', offset: o, size: 4 });
                s.fields.push({ name: 'Type', value: getSectionType(s.type), offset: o + 4, size: 4 });
                s.fields.push({ name: 'Flags', value: getSectionFlags(s.flags), offset: o + 8, size: 4 });
                s.fields.push({ name: 'Address', value: '0x' + s.addr.toString(16), offset: o + 12, size: 4 });
                s.fields.push({ name: 'File Offset', value: '0x' + s.offset.toString(16), offset: o + 16, size: 4 });
                s.fields.push({ name: 'Size', value: formatBytes(s.size), offset: o + 20, size: 4 });
                s.fields.push({ name: 'Link', value: s.link, offset: o + 24, size: 4 });
                s.fields.push({ name: 'Info', value: s.info, offset: o + 28, size: 4 });
                s.fields.push({ name: 'Alignment', value: s.addralign, offset: o + 32, size: 4 });
                s.fields.push({ name: 'Entry Size', value: s.entsize, offset: o + 36, size: 4 });
            }
            if (s.size > 0 && s.type !== 8 && s.type !== 0) {
                if (reader.inRange(s.offset, s.size)) {
                    s.dataPreview = Array.from(data.slice(s.offset, s.offset + Math.min(s.size, 64)));
                } else {
                    warn('Section #' + i + ' data range out of file bounds');
                }
            }
            secs.push(s);
        }
    }

    await progress(55, 'Parsing strings...');

    const strs = [];
    for (const s of secs) {
        if (s.type === 3) {
            if (!reader.inRange(s.offset, s.size)) {
                warn('String table ' + (s.name || '(unnamed)') + ' out of file bounds');
                continue;
            }
            const sd = data.slice(s.offset, s.offset + s.size);
            let cs = '';
            let so = 0;
            for (let i = 0; i < sd.length; i++) {
                if (sd[i] === 0) {
                    if (cs.length > 0) strs.push({ value: cs, offset: s.offset + so, size: cs.length + 1, section: s.name });
                    cs = '';
                    so = i + 1;
                } else if (sd[i] >= 32 && sd[i] < 127) {
                    cs += String.fromCharCode(sd[i]);
                }
            }
        }
    }

    await progress(70, 'Parsing symbols...');

    const syms = [];
    const symSections = [];
    for (const sec of secs) {
        if (sec.type === 2 || sec.type === 11) {
            symSections.push(sec.name || '(unnamed)');
            if (!reader.inRange(sec.offset, sec.size)) {
                warn('Symbol section ' + (sec.name || '(unnamed)') + ' out of file bounds');
                continue;
            }
            const strtabSec = secs[sec.link];
            if (!strtabSec) {
                warn('Symbol section ' + (sec.name || '(unnamed)') + ' has invalid string table link');
                continue;
            }
            if (!reader.inRange(strtabSec.offset, strtabSec.size)) {
                warn('String table for ' + (sec.name || '(unnamed)') + ' out of file bounds');
                continue;
            }
            const strtabData = data.slice(strtabSec.offset, strtabSec.offset + strtabSec.size);
            const entrySize = sec.entsize || (is64 ? 24 : 16);
            if (!entrySize) {
                warn('Symbol section ' + (sec.name || '(unnamed)') + ' has zero entry size');
                continue;
            }
            const numEntries = Math.floor(sec.size / entrySize);
            for (let i = 0; i < numEntries && i < 2000; i++) {
                const o = sec.offset + i * entrySize;
                if (!reader.inRange(o, entrySize)) {
                    warn('Symbol entry out of range in ' + (sec.name || '(unnamed)'));
                    break;
                }
                const sym = {};
                if (is64) {
                    sym.nameIdx = reader.u32(o, 'st_name');
                    sym.info = data[o + 4];
                    sym.other = data[o + 5];
                    sym.shndx = reader.u16(o + 6, 'st_shndx');
                    sym.value = reader.u64(o + 8, 'st_value');
                    sym.size = reader.u64(o + 16, 'st_size');
                } else {
                    sym.nameIdx = reader.u32(o, 'st_name');
                    sym.value = reader.u32(o + 4, 'st_value');
                    sym.size = reader.u32(o + 8, 'st_size');
                    sym.info = data[o + 12];
                    sym.other = data[o + 13];
                    sym.shndx = reader.u16(o + 14, 'st_shndx');
                }
                sym.name = (sym.nameIdx < strtabData.length) ? readStr(strtabData, sym.nameIdx) : '';
                if (sym.nameIdx >= strtabData.length) warn('Symbol name string offset 0x' + sym.nameIdx.toString(16) + ' out of range');
                sym.name = sym.name || '(unnamed #' + i + ')';
                sym.bind = sym.info >> 4;
                sym.type = sym.info & 0xf;
                sym.offset = o;
                sym.section = sec.name || '(unnamed)';
                sym.index = i;
                sym.shndxDisplay = getSymbolSection(sym.shndx);
                syms.push(sym);
            }
        }
    }

    await progress(85, 'Finalizing...');

    return {
        is64,
        isLE,
        header: hdr,
        programHeaders: phs,
        sectionHeaders: secs,
        strings: strs,
        symbols: syms,
        symbolSections: symSections,
        warnings
    };
}
