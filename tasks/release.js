process.env.NODE_ENV = 'production'

const inquirer = require('inquirer')
const fs = require('fs-extra')
const shell = require('shelljs')
const { say } = require('cfonts')
const chalk = require('chalk')
const del = require('del')
const { spawn } = require('child_process')
const webpack = require('webpack')
const Multispinner = require('multispinner')


const mainConfig = require('../webpack.main.config')
const rendererConfig = require('../webpack.renderer.config')


const doneLog = chalk.bgGreen.white(' DONE ') + ' '
const errorLog = chalk.bgRed.white(' ERROR ') + ' '
const okayLog = chalk.bgBlue.white(' OKAY ') + ' '
const isCI = process.env.CI || false


CONF_FILE = '.release.json'

if (process.env.BUILD_TARGET === 'clean') clean()
else release()


function release (target) {
  greeting()

  if (!target) {
    inquirer.prompt([{
      type: "list",
      name: "target",
      message: 'Select release target',
      choices: ["sentry", "git"]
    }])
    .then(answer => {
      if (answer.target == 'git') {
        return releaseGithub()
      } else if (answer.target == 'sentry') {
        return releaseSentry()
      }
    })
  }
}


function ensureConfig() {
  return fs.pathExists(CONF_FILE)
  .then(exists => {
    if (!exists) {
      return fs.writeJson(CONF_FILE, {})
    }
  })
}

function run(command) {
  console.log(command)
  return shell.exec(command)
}


/* ------- Github -------- */
function releaseGithub() {
  return fs.readJson('package.json')
  .then(package => inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: `Version is ${package.version}, confirm?`,
      defaultt: true
  }]))
  .then(answer => answer.confirm ? getGithubConfig() : process.exit(0))
  .then(config => {
    run(`cross-env GH_TOKEN=${config.authToken} build -l -p always`)
  })
}

function getGithubConfig() {
  return ensureConfig()
  .then(() => fs.readJson(CONF_FILE))
  .then(config => config.github || createGithubConfig())
}

function createGithubConfig() {
  var config = {
    authToken: null
  }

  var questions = [+
    {
      name: 'authToken',
      message: 'Enter your github API Token',
      default: config.authToken
    }
  ]
  
  return fs.readJson(CONF_FILE)
  .then(config => {
    return inquirer.prompt(questions)
    .then(answers => {
      config.github = answers
      return fs.writeJson(CONF_FILE, config, {spaces: 2})
    })
    .then(() => config.github)
  })
}

/* -------------- -------- */

/* ------- Sentry -------- */

function releaseSentry() {
  getSentryConfig()  
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



function getSentryConfig() {
  return ensureConfig()
  .then(() => fs.readJson(CONF_FILE))
  .then(config => config.sentry || createSentryConfig())
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

function createSentryConfig() {
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
      default: config.sentryOrg
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
  
  return fs.readJson(CONF_FILE)
  .then(config => {
    return inquirer.prompt(questions)
    .then(answers => {
      config.sentry = answers
      return fs.writeJson(CONF_FILE, config, {spaces: 2})
    })
    .then(() => config.sentry)
  })
}

/* ----------------------- */

function greeting () {
  const cols = process.stdout.columns
  let text = ''

  if (cols > 85) text = 'release'
  else if (cols > 60) text = 'release'
  else text = false

  if (text && !isCI) {
    say(text, {
      colors: ['yellow'],
      font: 'simple3d',
      space: false
    })
  } else console.log(chalk.yellow.bold('\n  lets-build'))
  console.log()
}
