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


RELEASE_CONFIG_FILE = '.release.json'

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
  return fs.pathExists(RELEASE_CONFIG_FILE)
  .then(exists => {
    if (!exists) {
      return fs.writeJson(RELEASE_CONFIG_FILE, {})
    }
  })
}

function run(command, options) {
  var options = options || {}
  
  if (!options.silent) {
    console.log(command)
  }
  
  return shell.exec(command, options)
}


/* ------- Github -------- */
function releaseGithub() {
  return Promise.all([fs.readJson('package.json'), fs.readJson('app/package.json')])
  .then(package => {
    if (package[0].version !== package[1].version) {
       console.error("package.json versions don't match")
       process.exit(1)
    }
    return package[0].version
  })
  .then(version => inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Using version ${version} for release, it this ok?`,
      default: true
    }
  ]))
  .then(answer => answer.confirm ? getGithubConfig() : process.exit(0))
  .then(config => {
    run(`cross-env GH_TOKEN=${config.authToken} build -l -p always`)
  })
}

function getGithubConfig() {
  return ensureConfig()
  .then(() => fs.readJson(RELEASE_CONFIG_FILE))
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
  
  return fs.readJson(RELEASE_CONFIG_FILE)
  .then(config => {
    return inquirer.prompt(questions)
    .then(answers => {
      config.github = answers
      return fs.writeJson(RELEASE_CONFIG_FILE, config, {spaces: 2})
    })
    .then(() => config.github)
  })
}

/* -------------- -------- */

/* ------- Sentry -------- */

function releaseSentry() {
  Promise.all([getSentryConfig(), fs.readJson('app/package.json')])
  .then(values => {
    var [sentryConfig, packageJson] = values
    
    if (sentryConfig.version == 'auto') {
      // sentryConfig.version = run(`sentry-cli releases propose-version`).stdout
      var currentVersion = packageJson.sentry.version
      if (currentVersion.indexOf('-') === -1 || currentVersion.indexOf('_') === -1 || currentVersion.indexOf('-') > currentVersion.indexOf('_') ) {
        console.error("Unable to create auto version, invalid version in config.json")
        process.exit(1)
      }

      var [releaseVersion, rest] = currentVersion.split('-')
      var [buildCounter, rest] = rest.split('_')

      if (releaseVersion == 'v' + packageJson.version) {
        buildCounter = parseInt(buildCounter) + 1
      } else {
        buildCounter = 0
      }

      var commitID = run('git rev-parse HEAD', {silent: true}).stdout.substr(0, 5)

      sentryConfig.version = `v${packageJson.version}-${buildCounter}_${commitID}`

      return inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Using ${sentryConfig.version} as release version, is this ok?`,
          default: true
        }
      ]).then(answer => {
        if (!answer.confirm) {
          process.exit(0)
        }
        return sentryConfig
      })
    }

    return sentryConfig
  })
  .then(sentryConfig => {
      process.env['SENTRY_AUTH_TOKEN'] = sentryConfig.authToken
      process.env['SENTRY_URL'] = sentryConfig.sentryURL
      process.env['SENTRY_ORG'] = sentryConfig.sentryOrg

      run(`sentry-cli releases new -p ${sentryConfig.projects.join(' -p ')} ${sentryConfig.version}`)

      for (let i = 0; i < sentryConfig.projects.length; i++) {
        process.env['SENTRY_PROJECT'] = sentryConfig.projects[i]

        if (sentryConfig.commit === 'auto') {
          run(`sentry-cli releases set-commits ${sentryConfig.version} --auto`)
        } else {
          run(`sentry-cli releases set-commits ${sentryConfig.version} --commit ${sentryConfig.commit}`)
        }

        run(`sentry-cli releases files ${sentryConfig.version} upload-sourcemaps app/dist`)
        run(`sentry-cli releases files ${sentryConfig.version} upload-sourcemaps --url-prefix '~/app/src' --ext vue app/src`)

        run(`sentry-cli releases finalize ${sentryConfig.version}`)  
      }

      return sentryConfig
  })
  .then(sentryConfig => {
    return fs.readJson('app/package.json')
    .then(packageJson => {
      packageJson.sentry.version = sentryConfig.sentry.version
      return fs.writeJson('app/package.json', packageJson)
    })
  })
}


function getSentryConfig() {
  return ensureConfig()
  .then(() => fs.readJson(RELEASE_CONFIG_FILE))
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
  
  return fs.readJson(RELEASE_CONFIG_FILE)
  .then(config => {
    return inquirer.prompt(questions)
    .then(answers => {
      config.sentry = answers
      return fs.writeJson(RELEASE_CONFIG_FILE, config, {spaces: 2})
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
