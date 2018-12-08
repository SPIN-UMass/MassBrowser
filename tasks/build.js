process.env.NODE_ENV = 'production'

const Promise = require('bluebird')

const chalk = require('chalk')
const del = require('del')

const webpack = require('webpack')
const Multispinner = require('multispinner')
const inquirer = require('inquirer')
const fs = require('fs-extra')
const yaml = require('js-yaml')
const { YELLOW, BLUE, LABEL_DONE, greeting, run, format } = require('./utils')


const targetInfo = {
  relay: {
    config: require('./webpack/webpack.relay.electron'),
    del: ['app/dist/relay/*', '!.gitkeep', '!assets/']
  },
  client: {
    config: require('./webpack/webpack.client.electron'),
    del: ['app/dist/client/*', 'app/dist/web/*', '!.gitkeep', '!assets/']
  }
}

main()

function main() {
  greeting('lets-build', 'lets-|build')

  if (process.env.BUILD_TARGET === 'clean') {
    clean()
  } else if (process.env.BUILD_TARGET) {
    buildForTarget(process.env.BUILD_TARGET)
  } else {
    askTargets()
  }
}

function clean () {
  del.sync(['build/*', '!build/icons', '!build/icons/icon.*'])
  console.log(`\n${LABEL_DONE}\n`)
  process.exit()
}

async function askTargets() {
  let answers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'targets',
      message: 'Select targets',
      choices: ['relay', 'client']
    }
  ])

  let targets = answers.targets
  for (let target of targets) {
    await buildForTarget(target)
  }
}

async function askPlatforms() {
  let answers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'platforms',
      message: 'Select platforms',
      choices: [
        {name: 'OSX', value: 'm'},
        {name: 'Windows', value: 'w'},
        {name: 'Linux', value: 'l'}
      ]
    }
  ])

  return answers.platforms.join('')
}


async function buildForTarget(target) {
  let config = yaml.safeLoad(await fs.readFile(`tasks/electron-builder/${target}.yml`))
  
  let platforms = await askPlatforms()
  if (!platforms) {
    console.log("No platforms selected")
    process.exit(0)
  }

  console.log(format(target, 'Packing...', BLUE))
  del.sync(targetInfo[target].del)
  await pack(targetInfo[target].config)

  console.log(format(target, 'Building...', BLUE))
  await run(`build -${platforms} --c.extraMetadata.main=./dist/${target}/electron.main.js --c.extraMetadata.name=${config.productName} --config='./tasks/electron-builder/${target}.yml'`, YELLOW, `${target}`)

  console.log(format(target, 'Renaming release files...', BLUE))
  if (platforms.indexOf('m') >= 0) {
    await fs.move(`build/${target}/latest-mac.yml`, `build/${target}/${target}-mac.yml`, { overwrite: true })
  }
  if (platforms.indexOf('w') >= 0) {
    await fs.move(`build/${target}/latest.yml`, `build/${target}/${target}.yml`, { overwrite: true })
  }
}

function pack (config) {
  return new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      if (err) reject(err.stack || err)
      else if (stats.hasErrors()) {
        let err = ''

        stats.toString({
          chunks: false,
          colors: true
        })
        .split(/\r?\n/)
        .forEach(line => {
          err += `    ${line}\n`
        })

        reject(err)
      } else {
        resolve(stats.toString({
          chunks: false,
          colors: true
        }))
      }
    })
  })
}


