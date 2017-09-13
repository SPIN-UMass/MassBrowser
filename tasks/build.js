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
  targets.forEach(target => buildForTarget(target))
}


async function buildForTarget(target) {
  let config = yaml.safeLoad(await fs.readFile(`tasks/electron-builder/${target}.yml`))
  
  console.log(format(target, 'Packing...', BLUE))
  del.sync(targetInfo[target].del)
  await pack(targetInfo[target].config)

  console.log(format(target, 'Building...', BLUE))
  await run(`build -mw --em.main=./dist/${target}/electron.main.js --em.name=${config.productName} --config='./tasks/electron-builder/${target}.yml'`, YELLOW, `${target}`)

  console.log(format(target, 'Renaming release files...', BLUE))
  await fs.move(`build/${target}/latest.yml`, `build/${target}/${target}.yml`, { overwrite: true })
  await fs.move(`build/${target}/latest-mac.yml`, `build/${target}/${target}-mac.yml`, { overwrite: true })
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


