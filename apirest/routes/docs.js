const express = require('express')
const router = express.Router()
const swaggerUi = require('swagger-ui-express')
const fs = require('fs')
const YAML = require('yaml')

const swaggerDocument = fs.readFileSync('./swagger.yaml', 'utf8')
const swagger = YAML.parseDocument(swaggerDocument)

router.use('/', swaggerUi.serve, swaggerUi.setup(swagger))

module.exports = router
