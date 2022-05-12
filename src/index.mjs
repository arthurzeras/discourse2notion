import 'dotenv/config';
import Parser from './parser.mjs';
import Notion from './notion.mjs';
import Discourse from './discourse.mjs';

async function createCategoryPage(category) {
  const page = await Notion.createMainPage({
    title: category.name,
    description: category.description,
  });

  console.log(`Category page "${category.name}" created in Notion`);

  return page.id;
}

async function createTopicPage(title, mainPageId) {
  const page = await Notion.createMainPage({ title, mainPageId });
  console.log(`Topic page "${title}" created in Notion`);
  return page.id;
}

async function createPostPage(post, topicPageId) {
  const parser = new Parser(post);
  await parser.parseAndHandleImages();
  const postTitle = parser.parsePostTitle();

  const content = [parser.createPostMetadataInfo(), ...parser.parsedContent];

  await Notion.createPostsPage({
    content,
    title: postTitle,
    parentPageId: topicPageId,
  });

  console.log(`Post page "${postTitle}" created in Notion`);
}

console.log('Starting migration');

for (const category of await Discourse.getCategories()) {
  const { slug, id } = category;
  const categoryPageId = await createCategoryPage(category);
  const topics = await Discourse.getTopicsFromCategory(slug, id);
  console.log(`${topics.length} topics found for category "${slug}"`);

  for (const topic of topics) {
    const topicPageId = await createTopicPage(topic.title, categoryPageId);
    const postsIds = await Discourse.getPostsFromTopic(topic.id);
    console.log(`${postsIds.length} post found for topic "${topic.title}"`);

    for (const postId of postsIds) {
      const post = await Discourse.getPostFullInfo(postId);
      await createPostPage(post, topicPageId);
    }
  }
}

console.log('Migration finished successfully');
