import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_SECRET,
});

const createMainPage = async ({ title, description, mainPageId }) => {
  try {
    const response = await notion.pages.create({
      parent: {
        page_id: mainPageId || process.env.NOTION_MAIN_PAGE_ID,
      },
      properties: {
        title: [
          {
            text: {
              content: title,
            },
          },
        ],
      },
      children: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ text: { content: description || '' } }],
          },
        },
      ],
    });

    return response;
  } catch (error) {
    console.log(`Failed to create main page: ${error.message}`);
    throw error;
  }
};

const createPostsPage = async ({ title, parentPageId, content }) => {
  try {
    const response = await notion.pages.create({
      parent: {
        page_id: parentPageId,
      },
      properties: {
        title: [
          {
            text: {
              content: title,
            },
          },
        ],
      },
      children: content,
    });

    return response;
  } catch (error) {
    console.log(`Failed to create posts page: ${error.message}`);
    throw error;
  }
};

export default { createMainPage, createPostsPage };
