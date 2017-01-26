/**
 * Apimodule Generator
 */

const moduleExists = require('../utils/moduleExists')
const versionExists = require('../utils/versionExists')
const toDashCase = require('../utils/dashCase')
const chalk = require('chalk')

const routeActions = require('../route').actions
const routePrompts = require('../route').routePrompts

const plop = require('node-plop')
const generatorRunner = require('node-plop/lib/modules/generator-runner').default(plop())

let version = 'v1'
module.exports = {
    description: 'Add a module to the api',
    prompts: [
        {
            type: 'input',
            name: 'version',
            message: 'Enter the version',
            default: 'v1',
            validate: (value) => {
                if ((/v[0-9]+/).test(value) && versionExists(value)) {
                    version = value
                    return true
                }

                return 'This version name doesn\'t exists'
            },
        }, {
            type: 'input',
            name: 'module',
            message: 'What should it be called?',
            default: 'test',
            validate: (value) => {
                if ((/.+/).test(value)) {
                    return moduleExists(value, version)
                        ? `A module with this name already exist ${version} ${value}`
                        : true
                }

                return 'The name is required'
            },
        }, {
            type: 'confirm',
            name: 'wantPrivate',
            default: true,
            message: 'Do you want some private routes?',
        }, {
            type: 'confirm',
            name: 'wantValidators',
            default: true,
            message: 'Do you want parameters validation for some routes?',
        }, {
            type: 'recursive',
            message: 'Do you want to add a ne route to the module?',
            name: 'routes',
            prompts: routePrompts,
        },
    ],
    actions: (data) => {
        const versionName = toDashCase(version).toLowerCase()
        const moduleName = toDashCase(data.module).toLowerCase()

        let actions = [
            {
                type: 'add',
                path: `${process.cwd()}/src/modules/${versionName}/${moduleName}/router.js`,
                templateFile: './module/router.js.hbs',
                abortOnFail: true,
            }, {
                type: 'add',
                path: `${process.cwd()}/src/modules/${versionName}/${moduleName}/controller.js`,
                templateFile: './module/controller.js.hbs',
                abortOnFail: true,
            }, {
                type: 'add',
                path: `${process.cwd()}/src/modules/${versionName}/${moduleName}/validators.js`,
                templateFile: './module/validators.js.hbs',
                abortOnFail: true,
            }, {
                type: 'add',
                path: `${process.cwd()}/test/${versionName}/${moduleName}.spec.js`,
                templateFile: './module/test.js.hbs',
                abortOnFail: true,
            },
        ]

        if (data.routes) {
            data.routes.forEach((routeData, i) => {
                routeData.version = data.version
                routeData.module = data.module
                actions.push((action, data) => {
                    try {
                        return generatorRunner.runGeneratorActions({ actions: routeActions }, routeData).then(result => {
                            result.changes.forEach(function (line) {
                                console.log(chalk.green('[SUCCESS]'), routeData.path + ' generated successfully!')
                            })
                            result.failures.forEach(function (line) {
                                console.log(chalk.red('[FAILED]'), line)
                            })
                            return Promise.resolve('routes generated')
                        })
                    } catch (e) {
                        console.log(e)
                    }
                })
            })
        }
        return actions
    },
}
