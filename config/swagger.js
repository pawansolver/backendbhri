const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'BHRI API Documentation',
            version: '1.0.0',
            description: 'API documentation for BHRI Backend',
        },
        servers: [
            {
                url: process.env.BASE_URL || 'http://localhost:5000',
                description: 'Current Server',
            },
            {
                url: 'http://localhost:5000',
                description: 'Local Development Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['./routes/*.js', './server.js'],
};

module.exports = swaggerJsdoc(options);
