"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NineToFiveMacScraper = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
class NineToFiveMacScraper {
    constructor() {
        this.rssUrl = 'https://9to5mac.com/feed/';
    }
    async scrape() {
        try {
            const response = await axios_1.default.get(this.rssUrl);
            const $ = cheerio.load(response.data, { xmlMode: true });
            const headlines = [];
            $('item').each((index, element) => {
                const $item = $(element);
                const title = $item.find('title').text().trim();
                const link = $item.find('link').text().trim();
                const creator = $item.find('dc\\:creator').text().trim();
                const comments = $item.find('slash\\:comments').text().trim();
                if (title && link && !creator.toLowerCase().includes('sponsored')) {
                    headlines.push({
                        title,
                        url: link,
                        popularity: parseInt(comments) || 0,
                        commentCount: parseInt(comments) || 0
                    });
                }
            });
            return headlines
                .sort((a, b) => b.popularity - a.popularity)
                .slice(0, 20);
        }
        catch (error) {
            console.error('Error scraping 9to5Mac:', error);
            return [];
        }
    }
}
exports.NineToFiveMacScraper = NineToFiveMacScraper;
