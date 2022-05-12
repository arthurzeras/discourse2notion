import axios from 'axios';

const headers = {
  'Api-Key': process.env.DISCOURSE_TOKEN,
  'Api-Username': process.env.DISCOURSE_USER,
};

const http = axios.create({ baseURL: process.env.DISCOURSE_URL, headers });

/**
 * Returns list of categories
 * @returns {Promise<{id: string, name: string, slug: string, description: string}[]>}
 */
const getCategories = async () => {
  try {
    const response = await http.get('categories.json');

    if (!response.data.category_list.categories.length) {
      throw response;
    }

    return response.data.category_list.categories;
  } catch (error) {
    console.log(`Failed to get Discourse categories: ${error.message}`);
    throw error.message;
  }
};

/**
 * Returns a list of topics from a category
 * @param {string} slug
 * @param {number} id
 * @param {any[]} allTopics
 * @param {number} page
 * @returns {Promise<{id: number, title: string}[]>}
 */
const getTopicsFromCategory = async (slug, id, allTopics = [], page = 0) => {
  try {
    const params = {
      page,
      order: 'default',
      ascending: false,
    };

    const response = await http.get(`c/${slug}/${id}/l/latest.json`, params);

    if (!response.data.topic_list.topics.length) {
      throw response;
    }

    allTopics = [...allTopics, ...response.data.topic_list.topics];

    if ('more_topics_url' in response.data.topic_list) {
      return getTopicsFromCategory(slug, id, allTopics, page + 1);
    }

    return allTopics;
  } catch (error) {
    console.log(
      `Failed to get topics for category "${slug}": ${error.message}`,
    );
    throw error.message;
  }
};

/**
 * Returns the ids of posts from a topic
 * @param {number} id
 * @returns {Promise<Number[]>}
 */
const getPostsFromTopic = async (id) => {
  try {
    const response = await http.get(`t/${id}.json`);

    if (!response.data.post_stream.stream.length) {
      throw response;
    }

    return response.data.post_stream.stream;
  } catch (error) {
    console.log(`Failed to get posts from topic "${id}": ${error.message}`);
    throw error.message;
  }
};

const getPostFullInfo = async (id) => {
  try {
    const response = await http.get(`posts/${id}.json`);
    return response.data;
  } catch (error) {
    console.log(`Failed to get post with id "${id}": ${error.message}`);
    throw error.message;
  }
};

export default {
  getCategories,
  getPostFullInfo,
  getPostsFromTopic,
  getTopicsFromCategory,
};
