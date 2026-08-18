/// This file in general is used to store configuration settings for the application.

const env = process.env;

const config = {
  listPerPage: env.LIST_PER_PAGE || 10,
}

export default config;