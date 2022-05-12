import { load } from 'cheerio';
import fetch from 'node-fetch';
import { markdownToBlocks } from '@tryfabric/martian';

export default class Parser {
  singlePost = {};
  parsedContent = {};

  constructor(singlePost) {
    this.singlePost = singlePost;
  }

  /**
   * Receive a post from Discourse, transform it into blocks of Notion.
   * It also handles images, using the src attribute of the post html content.
   */
  async parseAndHandleImages() {
    const $ = load(this.singlePost.cooked);

    const blocks = markdownToBlocks(this.singlePost.raw, {
      strictImageUrls: false,
    });

    const parsedBlocks = blocks.map(async (block) => {
      if (block.type === 'image') {
        const sha = block.image.external.url
          .replace('upload://', '')
          .slice(0, -4);

        const imgSrc = $(`img[data-base62-sha1="${sha}"]`)[0].attribs.src;
        const imageUrl = imgSrc.startsWith('//')
          ? imgSrc.replace('//', 'https://')
          : imgSrc;

        const validUrl = await this.validateImageUrl(imageUrl);

        if (validUrl) {
          block.image.external.url = imageUrl;
          return block;
        }

        return {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: imageUrl,
                },
              },
            ],
          },
        };
      }

      return block;
    }, []);

    // Remove mail links, because they are not supported by Notion
    const pattern = /,"link":{"type":"url","url":"mailto:.*?"}/g;
    this.parsedContent = JSON.parse(
      JSON.stringify(await Promise.all(parsedBlocks)).replace(pattern, ''),
    );
  }

  async validateImageUrl(url) {
    const response = await fetch(url);
    return response.status === 200;
  }

  parsePostTitle = (defaultTitle = '') => {
    let title = defaultTitle;

    const heading = this.parsedContent.find((block) =>
      [...Array(6)].map((_, i) => `heading_${i + 1}`).includes(block.type),
    );

    if (heading) {
      const text = heading[heading.type].rich_text.find(
        (text) => text.type === 'text',
      );

      if (text) {
        title = text.text.content;
      }
    }

    return title;
  };

  formatDate(timestamp) {
    const date = new Date(timestamp);
    const params = {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    };

    return new Intl.DateTimeFormat('pt-BR', params)
      .format(date)
      .replace(/\d{4}/g, (substr) => `${substr} às`);
  }

  createPostMetadataInfo() {
    const defineTextBlock = (content, bold = false) => ({
      type: 'text',
      annotations: {
        bold,
        code: false,
        italic: false,
        underline: false,
        color: 'default',
        strikethrough: false,
      },
      text: {
        content,
      },
    });

    const blocks = {
      object: 'block',
      type: 'callout',
      callout: {
        icon: {
          emoji: '📌',
        },
        color: 'gray_background',
        rich_text: [
          defineTextBlock('Criado por '),
          defineTextBlock(this.singlePost.name, true),
          defineTextBlock(' em '),
          defineTextBlock(this.formatDate(this.singlePost.created_at), true),
        ],
      },
    };

    if (this.singlePost.updated_at) {
      blocks.callout.rich_text.push(
        ...[
          defineTextBlock('\nÚltima atualização em '),
          defineTextBlock(this.formatDate(this.singlePost.updated_at), true),
        ],
      );
    }

    return blocks;
  }
}
