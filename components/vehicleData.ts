import { VehicleCategory } from '../types';

export const VEHICLE_DATA: Record<string, Record<string, Record<string, string[]>>> = {
    [VehicleCategory.FOUR_WHEELER]: {
        "Maruti Suzuki": {
            "Swift": ["LXi", "VXi", "VXi (O)", "ZXi", "ZXi+"],
            "Baleno": ["Sigma", "Delta", "Zeta", "Alpha"],
            "Brezza": ["LXi", "VXi", "ZXi", "ZXi+"],
            "Ertiga": ["LXi", "VXi", "ZXi", "ZXi+"],
        },
        "Hyundai": {
            "Creta": ["E", "EX", "S", "S+", "SX", "SX(O)"],
            "Venue": ["E", "S", "S(O)", "SX", "SX(O)"],
            "i20": ["Magna", "Sportz", "Asta", "Asta (O)"],
            "Verna": ["EX", "S", "SX", "SX(O)"],
        },
        "Tata": {
            "Nexon": ["XE", "XM", "XM (S)", "XZ+", "XZ+ (HS)", "XZ+ (L)"],
            "Nexon EV": ["Creative+", "Fearless", "Fearless+", "Empowered"],
            "Punch": ["Pure", "Adventure", "Accomplished", "Creative"],
            "Harrier": ["Smart", "Pure", "Adventure", "Fearless"],
            "Safari": ["Smart", "Pure", "Adventure", "Fearless"],
        },
        "Mahindra": {
            "XUV700": ["MX", "AX3", "AX5", "AX7", "AX7L"],
            "Scorpio-N": ["Z2", "Z4", "Z6", "Z8", "Z8L"],
            "Thar": ["AX (O)", "LX"],
            "XUV300": ["W4", "W6", "W8", "W8 (O)"],
        },
        "Kia": {
            "Seltos": ["HTE", "HTK", "HTK+", "HTX", "HTX+", "GTX+", "X-Line"],
            "Sonet": ["HTE", "HTK", "HTK+", "HTX", "HTX+", "GTX+", "X-Line"],
            "Carens": ["Premium", "Prestige", "Prestige+", "Luxury", "Luxury+"],
        },
        "Honda": {
            "City": ["SV", "V", "VX", "ZX"],
            "Amaze": ["E", "S", "VX"],
        },
        "Toyota": {
            "Fortuner": ["4x2 MT", "4x2 AT", "4x4 MT", "4x4 AT", "Legender", "GR-S"],
            "Innova Crysta": ["GX", "VX", "ZX"],
            "Urban Cruiser Hyryder": ["E", "S", "G", "V"],
        },
    },
    [VehicleCategory.TWO_WHEELER]: {
        "Honda": {
            "Activa 6G": ["Standard", "DLX", "Smart"],
            "Shine": ["Drum", "Disc"],
        },
        "Hero": {
            "Splendor Plus": ["Self Start", "i3s", "Black and Accent"],
            "Passion Pro": ["Drum", "Disc"],
            "Glamour": ["Drum", "Disc", "Blaze Edition"],
        },
        "Royal Enfield": {
            "Classic 350": ["Redditch", "Halcyon", "Dark", "Chrome"],
            "Hunter 350": ["Retro", "Metro", "Metro Rebel"],
            "Meteor 350": ["Fireball", "Stellar", "Supernova"],
        },
        "TVS": {
            "Jupiter": ["Standard", "ZX", "Classic", "SmartXonnect"],
            "Apache RTR 160": ["2V", "4V", "4V Special Edition"],
            "Raider 125": ["Drum", "Disc", "SmartXonnect"],
        },
        "Bajaj": {
            "Pulsar 150": ["Neon", "Standard", "Twin Disc"],
            "Pulsar NS200": ["Standard"],
            "Platina 110": ["Drum", "Disc", "ABS"],
        },
    },
};
