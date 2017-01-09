/**
 * Route Generator
 */
const fs = require('fs')
const moduleExists = require('../utils/moduleExists')
const versionExists = require('../utils/versionExists')
const toDashCase = require('../utils/dashCase')

function trimTemplateFile (template) {
    // Loads the template file and trims the whitespace and then returns the content as a string.
    return fs.readFileSync(`generators/route/${template}`, 'utf8')
}

function isValidMethod (value) {
    return value === 'GET' || value === 'POST' || value === 'PATH' || value === 'DELETE' || value === 'PUT'
}

let version = 'v1'

const routePrompts = [
    {
        type: 'input',
        name: 'path',
        message: 'Enter the path of the route. (module name will be the base url)',
        default: '/',
        validate: (value) => {
            if (!(/\/.+/).test(value)) {
                return 'invalide path : (/profile/:id or /test)'
            }
            return true
        },
    }, {
        type: 'input',
        name: 'method',
        message: 'Enter the method (POST, GET, PATCH, DELETE, PUT)',
        default: 'GET',
        validate: (value) => {
            if ((/.+/).test(value) && isValidMethod(value)) {
                return true
            }

            return 'invalid method'
        },
    }, {
        type: 'input',
        name: 'handler',
        message: 'Enter the handler name',
        default: 'test',
        validate: (value) => {
            if ((/.+/).test(value)) {
                return true
            }

            return 'hanlder is required'
        },
    }, {
        type: 'confirm',
        name: 'secureRoute',
        default: false,
        message: 'Does it is secured?',
    }, {
        type: 'confirm',
        name: 'validateRoute',
        default: false,
        message: 'Does it need parameter validation?',
    },
]

const prompts = [
    {
        type: 'input',
        name: 'version',
        message: 'Enter the version',
        default: 'v1',
        validate: (value) => {
            if ((/v.+/).test(value) && versionExists(value)) {
                version = value
                return true
            }

            return 'This version name doesn\'t exists'
        },
    }, {
        type: 'input',
        name: 'module',
        message: 'Which module the route is for?',
        default: 'users',
        validate: (value) => {
            if ((/.+/).test(value)) {
                return moduleExists(value, version)
                    ? true
                    : `"${value}" doesn't exist.`
            }

            return 'The module is required'
        },
    },
    ...routePrompts,
]

const actions = (data) => {
    console.log('route', data)
    const versionName = toDashCase(version).toLowerCase()
    const moduleName = toDashCase(data.module).toLowerCase()

    if (data.path !== '') {
        data.url = `/${versionName}/${moduleName}${data.path}`
    } else {
        data.url = `/${versionName}/${moduleName}`
    }
    const actions = [
        {
            type: 'modify',
            path: `${process.cwd()}/src/modules/${versionName}/${moduleName}/router.js`,
            pattern: /(\n\s*)(\/\* GENERATED: ROUTES .*\*\/)/g,
            template: trimTemplateFile('router.js.hbs'),
        }, {
            type: 'modify',
            path: `${process.cwd()}/src/modules/${versionName}/${moduleName}/controller.js`,
            pattern: /(\n\s*\/\* GENERATED: HANDLER .*\*\/)/g,
            template: trimTemplateFile('handler.js.hbs'),
        }, {
            type: 'modify',
            path: `${process.cwd()}/src/modules/${versionName}/${moduleName}/controller.js`,
            pattern: /(\n\s*)(\/\* GENERATED: EXPORT.*\*\/)/g,
            template: '$1{{ camelCase handler }},$1$2',
        }, {
            type: 'modify',
            path: `${process.cwd()}/src/modules/${versionName}/${moduleName}/validators.js`,
            pattern: /(\n\s*)(\/\* GENERATED: EXPORT .*\*\/)/g,
            template: '$1{{ camelCase handler }},$1$2 ',
        }, {
            type: 'modify',
            path: `${process.cwd()}/test/${versionName}/${moduleName}.spec.js`,
            pattern: /(\n\s*)(\/\* GENERATED: TEST .*\*\/)/g,
            template: trimTemplateFile('test.js.hbs'),
        },
    ]

    if (data.validateRoute) {
        actions.push({
            type: 'modify',
            path: `${process.cwd()}/src/modules/${versionName}/${moduleName}/validators.js`,
            pattern: /(\/\* GENERATED: VALIDATOR .*\*\/)/g,
            template: trimTemplateFile('validator.js.hbs'),
        })
    }
    return actions
}

module.exports = {
    description: 'Add a route',
    prompts,
    actions,
    routePrompts,
}
