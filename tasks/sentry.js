const fs = require('fs-jetpack')
const inquirer = require('inquirer')
const request = require('request-promise')
const shell = require('shelljs')
CONF_FILE = '.sentry.json'

release()

function release() {
  getConfig()  
  .then(config => {
    process.env['SENTRY_AUTH_TOKEN'] = config.authToken
    process.env['SENTRY_URL'] = config.sentryURL
    process.env['SENTRY_ORG'] = config.sentryOrg

    if (config.version == 'auto') {
      config.version = run(`sentry-cli releases propose-version`).stdout
      console.log(`Version: ${config.version}`)
    }

    run(`sentry-cli releases new -p ${config.projects.join(' -p ')} ${config.version}`)

    for (let i = 0; i < config.projects.length; i++) {
      process.env['SENTRY_PROJECT'] = config.projects[i]

      if (config.commit === 'auto') {
        run(`sentry-cli releases set-commits ${config.version} --auto`)
      } else {
        run(`sentry-cli releases set-commits ${config.version} --commit ${config.commit}`)
      }
    }
    
    
    // shell.exec(`sentry-cli releases set-commits ${config.version} --commit ${config.commit}`)
  })
}

function run(command) {
  console.log(command)
  return shell.exec(command)
}

function getConfig() {
  return fs.existsAsync(CONF_FILE)
  .then(exists => {
    if (!exists) {
      return createConfig()
    }
  })
  .then(() => fs.readAsync(CONF_FILE, 'json'))
  .then(config => {
    return inquirer.prompt([
      {
        'name': 'commit',
        'message': 'Enter release commit ID',
        'default': 'auto'
      },
      {
        'name': 'version',
        'message': 'Enter version identifier',
        'default': 'auto'
      }
    ])
    .then(answers => {
      config.commit = answers.commit
      config.version = answers.version
      return config
    })
  })
}

function createConfig() {
  var config = {
    authToken: '',
    repoName: '',
    projects: '',
    sentryURL: 'https://sentry.yaler.co/',
    sentryOrg: 'sentry'
  }

  var questions = [
    {
      name: 'sentryURL',
      message: 'Whats your sentry release URL?',
      default: config.sentryURL
    },
        {
      name: 'sentryOrg',
      message: 'Whats your sentry organization slug?',
      default: config.sentryURL
    },
    {
      name: 'repoName',
      message: 'Whats the repository name? (e.g. someon/someproject)',
      default: config.repoName
    },
    {
      name: 'projects',
      message: 'List the related sentry project names (space seperated)',
      filter: a => a.split(' ')
    },
    {
      name: 'authToken',
      message: 'Enter your sentry Auth Token',
      default: config.authToken
    }
  ]

  return inquirer.prompt(questions)
  .then(answers => {
    return fs.writeAsync(CONF_FILE, answers)
  })
}