/**
 * Route Generator
 */
const modelExists = require('../utils/modelExists')

const paramPrompts = [
    {
        type: 'input',
        name: 'name',
        message: 'What is the parameter name?',
    },
    {
        type: 'list',
        name: 'type',
        message: 'What is the parameter type?',
        choices: [
            'String',
            'Number',
            'Date',
            'Boolean',
            'ObjectId',
            'Array',
        ],
    },
    {
        type: 'confirm',
        name: 'required',
        default: false,
        message: 'is it required?',
    },
    {
        type: 'confirm',
        name: 'unique',
        default: false,
        message: 'is it unique?',
    },
]

module.exports = {
    description: 'Add a mongo model',
    prompts: [
        {
            type: 'input',
            name: 'name',
            message: 'What is the model name? (user, upload...)',
            validate: (value) => {
                if ((/.+/).test(value)) {
                    return !modelExists(value)
                }
                return 'Name is required'
            },
        }, {
            type: 'confirm',
            name: 'timestamps',
            message: 'What to add creation and update date?',
            default: true,
        }, {
            message: 'Do you want to add a fields to the model?',
            type: 'recursive',
            name: 'fields',
            prompts: paramPrompts,
        },
    ],

    // Add the route to the routes.js file above the error route
    actions: (data) => {
        return [{
            type: 'add',
            path: process.cwd() + '/src/models/{{camelCase name}}s.js',
            templateFile: './model/model.js.hbs',
            abortOnFail: true,
        }, ]
    },
}
