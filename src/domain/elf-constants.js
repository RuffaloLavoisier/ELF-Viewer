export const OSABI_MAP = {
    0: 'System V',
    1: 'HP-UX',
    2: 'NetBSD',
    3: 'Linux',
    6: 'Solaris',
    7: 'AIX',
    8: 'IRIX',
    9: 'FreeBSD',
    10: 'TRU64',
    11: 'Modesto',
    12: 'OpenBSD',
    13: 'OpenVMS',
    14: 'NSK',
    15: 'AROS',
    64: 'ARM EABI',
    97: 'ARM',
    255: 'Standalone'
};

export function getOSABI(v) {
    return OSABI_MAP[v] || 'Unknown (0x' + v.toString(16) + ')';
}

export function getElfType(v) {
    const t = {
        0: 'NONE',
        1: 'REL (Relocatable)',
        2: 'EXEC (Executable)',
        3: 'DYN (Shared object)',
        4: 'CORE (Core file)'
    };
    if (t[v]) return t[v];
    if (v >= 0xfe00 && v <= 0xfeff) return 'OS-specific (0x' + v.toString(16) + ')';
    if (v >= 0xff00 && v <= 0xffff) return 'Processor-specific (0x' + v.toString(16) + ')';
    return 'Unknown (0x' + v.toString(16) + ')';
}

export const MACHINE_MAP = {
    0: 'No machine',
    1: 'AT&T WE 32100',
    2: 'SPARC',
    3: 'Intel 80386',
    4: 'Motorola 68000',
    5: 'Motorola 88000',
    6: 'Reserved',
    7: 'Intel 80860',
    8: 'MIPS I',
    9: 'IBM System/370',
    10: 'MIPS RS3000 LE',
    11: 'Reserved',
    12: 'Reserved',
    13: 'Reserved',
    14: 'Reserved',
    15: 'PA-RISC',
    16: 'Reserved',
    17: 'Fujitsu VPP500',
    18: 'SPARC32PLUS',
    19: 'Intel 80960',
    20: 'PowerPC',
    21: 'PowerPC64',
    22: 'S390',
    23: 'Reserved',
    24: 'Reserved',
    25: 'Reserved',
    26: 'Reserved',
    27: 'Reserved',
    28: 'Reserved',
    29: 'Reserved',
    30: 'Reserved',
    31: 'Reserved',
    32: 'Reserved',
    33: 'Reserved',
    34: 'Reserved',
    35: 'Reserved',
    36: 'NEC V800',
    37: 'Fujitsu FR20',
    38: 'TRW RH-32',
    39: 'Motorola RCE',
    40: 'ARM',
    41: 'Digital Alpha',
    42: 'Hitachi SH',
    43: 'SPARC V9',
    44: 'Siemens TriCore',
    45: 'Argonaut RISC Core',
    46: 'Hitachi H8/300',
    47: 'Hitachi H8/300H',
    48: 'Hitachi H8S',
    49: 'Hitachi H8/500',
    50: 'Intel IA-64',
    51: 'Stanford MIPS-X',
    52: 'Motorola ColdFire',
    53: 'Motorola M68HC12',
    54: 'Fujitsu MMA',
    55: 'Siemens PCP',
    56: 'Sony nCPU',
    57: 'Denso NDR1',
    58: 'Motorola Star*Core',
    59: 'Toyota ME16',
    60: 'STMicroelectronics ST100',
    61: 'Advanced Logic TinyJ',
    62: 'AMD x86-64',
    63: 'Sony DSP',
    64: 'PDP-10',
    65: 'PDP-11',
    66: 'Siemens FX66',
    67: 'STMicroelectronics ST9+',
    68: 'STMicroelectronics ST7',
    69: 'Motorola 68HC16',
    70: 'Motorola 68HC11',
    71: 'Motorola 68HC08',
    72: 'Motorola 68HC05',
    73: 'Silicon Graphics SVx',
    75: 'Digital VAX',
    76: 'Axis Communications CRIS',
    77: 'Infineon Javelin',
    78: 'Element 14 FirePath',
    79: 'LSI Logic ZSP',
    80: 'MMIX',
    81: 'Harvard HUANY',
    82: 'SiTera Prism',
    83: 'Atmel AVR',
    84: 'Fujitsu FR30',
    85: 'Mitsubishi D10V',
    86: 'Mitsubishi D30V',
    87: 'NEC v850',
    88: 'Mitsubishi M32R',
    89: 'Matsushita MN10300',
    90: 'Matsushita MN10200',
    91: 'picoJava',
    92: 'OpenRISC',
    93: 'ARC Tangent-A5',
    94: 'Tensilica Xtensa',
    95: 'Alphamosaic VideoCore',
    96: 'Thompson Multimedia GPP',
    97: 'National Semiconductor 32000',
    98: 'Tenor Network TPC',
    99: 'Trebia SNP 1000',
    100: 'STMicroelectronics ST200',
    101: 'Ubicom IP2xxx',
    102: 'MAX Processor',
    103: 'CompactRISC',
    104: 'Fujitsu F2MC16',
    105: 'Texas Instruments MSP430',
    106: 'Analog Devices Blackfin',
    107: 'Seiko Epson S1C33',
    108: 'Sharp embedded',
    109: 'Arca RISC',
    110: 'Unicore',
    183: 'AArch64',
    243: 'RISC-V'
};

export function getMachine(v) {
    return MACHINE_MAP[v] || 'Unknown (0x' + v.toString(16) + ')';
}

export const SEGMENT_TYPE_MAP = {
    0: 'NULL',
    1: 'LOAD',
    2: 'DYNAMIC',
    3: 'INTERP',
    4: 'NOTE',
    5: 'SHLIB',
    6: 'PHDR',
    7: 'TLS',
    8: 'NUM',
    0x60000000: 'LOOS',
    0x6474e550: 'GNU_EH_FRAME',
    0x6474e551: 'GNU_STACK',
    0x6474e552: 'GNU_RELRO',
    0x6ffffffa: 'SUNWBSS',
    0x6ffffffb: 'SUNWSTACK',
    0x6fffffff: 'HIOS',
    0x70000000: 'LOPROC',
    0x7fffffff: 'HIPROC',
    0x70000001: 'ARM_EXIDX',
    0x70000002: 'ARM_PREEMPTMAP',
    0x70000003: 'ARM_ATTRIBUTES',
    0x70000004: 'ARM_DEBUGOVERLAY',
    0x70000005: 'ARM_OVERLAYSECTION'
};

export function getSegmentType(v) {
    return SEGMENT_TYPE_MAP[v] || '0x' + v.toString(16);
}

export function getSegmentFlags(v) {
    let f = [];
    if (v & 4) f.push('R');
    if (v & 2) f.push('W');
    if (v & 1) f.push('X');
    return f.join('') || 'NONE';
}

export const SECTION_TYPE_MAP = {
    0: 'NULL',
    1: 'PROGBITS',
    2: 'SYMTAB',
    3: 'STRTAB',
    4: 'RELA',
    5: 'HASH',
    6: 'DYNAMIC',
    7: 'NOTE',
    8: 'NOBITS',
    9: 'REL',
    10: 'SHLIB',
    11: 'DYNSYM',
    14: 'INIT_ARRAY',
    15: 'FINI_ARRAY',
    16: 'PREINIT_ARRAY',
    17: 'GROUP',
    18: 'SYMTAB_SHNDX',
    19: 'NUM',
    0x60000000: 'LOOS',
    0x6ffffff5: 'GNU_ATTRIBUTES',
    0x6ffffff6: 'GNU_HASH',
    0x6ffffff7: 'GNU_LIBLIST',
    0x6ffffff8: 'CHECKSUM',
    0x6ffffffa: 'SUNW_move',
    0x6ffffffb: 'SUNW_COMDAT',
    0x6ffffffc: 'SUNW_syminfo',
    0x6ffffffd: 'GNU_verdef',
    0x6ffffffe: 'GNU_verdneed',
    0x6fffffff: 'GNU_versym',
    0x70000000: 'LOPROC',
    0x7fffffff: 'HIPROC',
    0x80000000: 'LOUSER',
    0x8fffffff: 'HIUSER'
};

export function getSectionType(v) {
    if (SECTION_TYPE_MAP[v]) return SECTION_TYPE_MAP[v];
    if (v >= 0x60000000 && v <= 0x6fffffff) return 'OS-specific (0x' + v.toString(16) + ')';
    if (v >= 0x70000000 && v <= 0x7fffffff) return 'Processor-specific (0x' + v.toString(16) + ')';
    if (v >= 0x80000000 && v <= 0x8fffffff) return 'Application-specific (0x' + v.toString(16) + ')';
    return 'Unknown (0x' + v.toString(16) + ')';
}

export function getSectionFlags(v) {
    let f = [];
    if (v & 0x1) f.push('W');
    if (v & 0x2) f.push('A');
    if (v & 0x4) f.push('X');
    if (v & 0x10) f.push('M');
    if (v & 0x20) f.push('S');
    if (v & 0x40) f.push('I');
    if (v & 0x80) f.push('L');
    if (v & 0x100) f.push('O');
    if (v & 0x200) f.push('G');
    if (v & 0x400) f.push('T');
    if (v & 0x800) f.push('C');
    const known = 0x1 | 0x2 | 0x4 | 0x10 | 0x20 | 0x40 | 0x80 | 0x100 | 0x200 | 0x400 | 0x800;
    if (v <= 0xffffffff) {
        const extra = v & ~known;
        if (extra) f.push('0x' + extra.toString(16));
    }
    return f.join('|') || 'NONE';
}

export function getSymbolType(v) {
    const t = {
        0: 'NOTYPE',
        1: 'OBJECT',
        2: 'FUNC',
        3: 'SECTION',
        4: 'FILE',
        5: 'COMMON',
        6: 'TLS',
        7: 'NUM',
        10: 'LOOS/GNU_IFUNC',
        11: 'HIOS',
        12: 'LOPROC',
        13: 'HIPROC'
    };
    return t[v] || 'UNKNOWN';
}

export function getSymbolBind(v) {
    const b = {
        0: 'LOCAL',
        1: 'GLOBAL',
        2: 'WEAK',
        3: 'NUM',
        10: 'LOOS/GNU_UNIQUE',
        12: 'HIOS',
        13: 'LOPROC',
        14: 'HIPROC'
    };
    return b[v] || 'UNKNOWN';
}

export function getSymbolSection(v) {
    if (v === 0) return 'SHN_UNDEF';
    if (v === 0xfff1) return 'SHN_ABS';
    if (v === 0xfff2) return 'SHN_COMMON';
    if (v === 0xffff) return 'SHN_XINDEX';
    if (v >= 0xff00 && v <= 0xff1f) return 'SHN_PROC_' + (v - 0xff00).toString(16).padStart(2, '0');
    if (v >= 0xff20 && v <= 0xff3f) return 'SHN_OS_' + (v - 0xff20).toString(16).padStart(2, '0');
    return String(v);
}
