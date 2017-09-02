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
const Promise = require('bluebird')
const yaml = require('js-yaml');


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
      choices: ["sentry", "git", "bintray"]
    }])
    .then(answer => {
      if (answer.target == 'git') {
        return releaseGithub()
      } else if (answer.target == 'sentry') {
        return releaseSentry()
      } else if (answer.target == 'bintray') {
        return releaseBintray()
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

/**
 * Steps:
 * 1: Check package.json version match
 * 2: Confirm version
 * 3: Get config
 *    3.1: GH_TOKEN (https://github.com/settings/tokens)
 */

function releaseGithub() {
  return Promise.all([fs.readJson('package.json'), fs.readJson('app/package.json')])
  .then(package => {
    if (package[0].version && package[0].version !== package[1].version) {
       console.error("package.json versions don't match")
       process.exit(1)
    }
    return package[1].version
  })
  .then(version => {
    return inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Using version ${version} for release, is this ok?`,
        default: true
      }
    ])
    .then(answer => answer.confirm ? getGithubConfig() : process.exit(0))
    .then(config => Object.assign(config, {version: version}))
  })
  .then(config => {
    return checkTargetBuilds(config)
    .then(targets => getFileLists(config, targets))
    .then(filelist => doReleaseGithub(config, filelist))
    // run(`cross-env GH_TOKEN=${config.authToken} build -mw -p always`)
  })
  .then(() => {
    console.log(chalk.yellow.bold('Release draft published, you will need to visit Github releases page to finalize the release'))
  })
}

function checkTargetBuilds(config) {
  const targets = ['client', 'relay']
  const version = config.version

  let promises = []

  return Promise.reduce(targets, (availableTargets, target) => {
    if (!fs.pathExistsSync(`./build/${target}.yml`)) {
      return availableTargets
    }
    
    return fs.readFile(`./build/${target}.yml`)
    .then(content => yaml.safeLoad(content))
    .then(c => c.version === version ? availableTargets.concat(target) : availableTargets)
  }, [])
  .then(availableTargets => {
    if (availableTargets.length === 0) {
      console.log(chalk.red.bold('No target build available, you should build before releasing'))
      process.exit(1)
    }
    return inquirer.prompt([
      {
        type: 'checkbox',
        name: 'targets',
        message: 'Select targets to publish in this release',
        choices: availableTargets
      }
    ]).then(answers => answers.targets)
  })
}

function getFileLists(config, targets) {
  const version = config.version

  return targets.reduce((files, target) => files.concat([
    `${target}.yml`,
    `${target}-mac.yml`,
    `${target}-${version}.dmg`,
    `${target}-${version}-mac.zip`,
    `${target} Setup ${version}.exe`,
  ]), [])
  .map(file => `build/${file}`)
}

function doReleaseGithub(config, filelist) {
  var CancellationToken = require('electron-builder-http/out/CancellationToken').CancellationToken;
  var GitHubPublisher = require('electron-publish/out/gitHubPublisher').GitHubPublisher;
  var MultiProgress = require('electron-publish/out/multiProgress').MultiProgress;
  var publishConfig = require('../package.json').build.publish
  var appPJson = require('../app/package.json')

  publishConfig.token = config.authToken

  const context = {
    cancellationToken: new CancellationToken(),
    progress: new MultiProgress()
  }
  const publisher = new GitHubPublisher(
      context,
      publishConfig,
      appPJson.version, 
      {
        publish: "always",
        draft: true
      })

  const errorlist = [];

  const uploads = filelist.map(file => {
      return publisher.upload(file)
          .catch((err) => {
              errorlist.push(err.response ? `Failed to upload ${file}, http status code ${err.response.statusCode}` : err);
              return Promise.resolve();
          });
  });

  return Promise.all(uploads)
  .then(() => errorlist.forEach((err) => console.error(err)));
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

  var questions = [
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


/* ------- Sentry -------- */

/**
 * Steps:
 * 1: Get config
*    1.1: authToken: sentry auth token
 *   1.2: sentryUrl: sentry url (e.g. https://sentry.yaler.co) 
 *   1.3: sentryOrg: sentry organization name (e.g. sentry)
 *   1.4: repoName: github repo name (e.g. srxzr/UOIS)
 *   1.5: project: sentry project names space seperated (e.g. client-dev)
 *   1.6: version: release version identifier (can be auto)
 *   1.7: commit: release commit ID (can be auto)
 * 2: 
 */

function releaseSentry() {
  Promise.all([getSentryConfig(), fs.readJson('app/package.json')])
  .then(values => {
    var [sentryConfig, packageJson] = values
    
    if (sentryConfig.version == 'auto') {
      // sentryConfig.version = run(`sentry-cli releases propose-version`).stdout
      var currentVersion = packageJson.config.sentry.version
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
      packageJson.config.sentry.version = sentryConfig.version
      console.log("Updating app/package.json")
      return fs.writeJson('app/package.json', packageJson, {spaces: 2})
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
      message: 'Whats the repository name? (e.g. someone/someproject)',
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
