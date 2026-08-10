import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: "3.1.0",
    info: {
      title: "Task management API",
      version: "0.1.0",
      description:
        "This is a simple CRUD API application made with Express and documented with Swagger",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: 'Development server'
      },
    ],
  },
  apis: ['./src/routes/*.js']
};

export default swaggerJsdoc(options);