"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const persistence_merger_1 = require("./persistence-merger");
const html_generator_1 = require("./html-generator");
const rss_generator_1 = require("./rss-generator");
async function main() {
    console.log(chalk_1.default.blue.bold('🚀 mnews2 - Tech News Aggregator'));
    console.log(chalk_1.default.gray('Starting news aggregation process...'));
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
        console.error(chalk_1.default.red('❌ OPENAI_API_KEY environment variable is required'));
        process.exit(1);
    }
    try {
        const merger = new persistence_merger_1.PersistenceMerger(openaiApiKey);
        await merger.processAllSources();
        const crossStories = await merger.getCrossPlatformStories();
        const allHeadlines = await merger.getRecentHeadlines(12);
        const crossStoryIds = new Set(crossStories.map(s => s.techmemeHeadlineId).filter(Boolean));
        const unmatchedHeadlines = allHeadlines.filter(h => !crossStoryIds.has(h.id));
        console.log(chalk_1.default.green(`✅ Found ${crossStories.length} cross-platform stories`));
        console.log(chalk_1.default.green(`✅ Found ${unmatchedHeadlines.length} unmatched headlines`));
        const htmlGenerator = new html_generator_1.HtmlGenerator();
        const rssGenerator = new rss_generator_1.RssGenerator();
        const htmlContent = htmlGenerator.generate(crossStories, unmatchedHeadlines);
        const rssContent = rssGenerator.generate(crossStories, unmatchedHeadlines);
        const outputDir = path_1.default.join(process.cwd(), 'dist');
        if (!fs_1.default.existsSync(outputDir)) {
            fs_1.default.mkdirSync(outputDir, { recursive: true });
        }
        fs_1.default.writeFileSync(path_1.default.join(outputDir, 'index.html'), htmlContent);
        fs_1.default.writeFileSync(path_1.default.join(outputDir, 'feed.xml'), rssContent);
        console.log(chalk_1.default.green('✅ Generated index.html and feed.xml'));
        console.log(chalk_1.default.blue(`📁 Output directory: ${outputDir}`));
        setTimeout(() => merger.close(), 1000);
        console.log(chalk_1.default.green.bold('🎉 News aggregation completed successfully!'));
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error during news aggregation:'), error);
        process.exit(1);
    }
}
if (require.main === module) {
    main().catch(error => {
        console.error(chalk_1.default.red('❌ Unhandled error:'), error);
        process.exit(1);
    });
}
