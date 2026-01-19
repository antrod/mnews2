import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { PersistenceMerger } from './persistence-merger';
import { HtmlGenerator } from './html-generator';
import { RssGenerator } from './rss-generator';
import { Headline, CrossPlatformStory } from './types';

async function main(): Promise<void> {
  console.log(chalk.blue.bold('🚀 mnews2 - Tech News Aggregator'));
  console.log(chalk.gray('Starting news aggregation process...'));

  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    console.error(chalk.red('❌ OPENAI_API_KEY environment variable is required'));
    process.exit(1);
  }

  try {
    const merger = new PersistenceMerger(openaiApiKey);
    
    await merger.processAllSources();
    
    const crossStories = merger.getCrossPlatformStories();
    const allHeadlines = merger.getRecentHeadlines(12);
    
    const crossStoryIds = new Set(crossStories.map(s => s.techmemeHeadlineId).filter(Boolean));
    const unmatchedHeadlines = allHeadlines.filter(h => !crossStoryIds.has(h.id));

    console.log(chalk.green(`✅ Found ${crossStories.length} cross-platform stories`));
    console.log(chalk.green(`✅ Found ${unmatchedHeadlines.length} unmatched headlines`));

    const htmlGenerator = new HtmlGenerator();
    const rssGenerator = new RssGenerator();

    const htmlContent = htmlGenerator.generate(crossStories, unmatchedHeadlines);
    const rssContent = rssGenerator.generate(crossStories, unmatchedHeadlines);

    const outputDir = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(path.join(outputDir, 'index.html'), htmlContent);
    fs.writeFileSync(path.join(outputDir, 'feed.xml'), rssContent);

    console.log(chalk.green('✅ Generated index.html and feed.xml'));
    console.log(chalk.blue(`📁 Output directory: ${outputDir}`));

    merger.close();
    
    console.log(chalk.green.bold('🎉 News aggregation completed successfully!'));
  } catch (error) {
    console.error(chalk.red('❌ Error during news aggregation:'), error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('❌ Unhandled error:'), error);
    process.exit(1);
  });
}

export { main };