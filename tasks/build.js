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


const targets = {
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
    build(process.env.BUILD_TARGET)
  } else {
    askTargets()
  }
}

function clean () {
  del.sync(['build/*', '!build/icons', '!build/icons/icon.*'])
  console.log(`\n${LABEL_DONE}\n`)
  process.exit()
}

function askTargets() {
  inquirer.prompt([
    {
      type: 'checkbox',
      name: 'targets',
      message: 'Select targets',
      choices: ['relay', 'client']
    }
  ])
  .then(answers => answers.targets)
  .then(targets => {
    var p = new Promise((r, _) => r())
    targets.forEach(target => {
      p = p.then(() => {
        console.log(format(target, 'Packing...', BLUE))
        return build(target)
        .then(() => console.log(format(target, 'Building...', BLUE)))
        .then(() => run(`build -mw --em.main=./dist/${target}/electron.main.js --config='./tasks/electron-builder/${target}.yml`, YELLOW, `${target}`))
      })
      .then(() => fs.readFile(`tasks/electron-builder/${target}.yml`))
      .then(y => yaml.safeLoad(y))
      .then(config => {
        console.log(format(target, 'Renaming release files...', BLUE))
        return Promise.all([
          fs.move(`build/${target}/latest.yml`, `build/${target}/${config.productName}.yml`, { overwrite: true }),
          fs.move(`build/${target}/latest-mac.yml`, `build/${target}/${config.productName}-mac.yml`, { overwrite: true })
        ])
      }) 
    })
  })
}


function singleBuild(target) {
  build(target)
  .then(() => {
    process.exit()
  })
  .catch(() => {
    console.error("Build failed")
  })
}

function build (target) {
  del.sync(targets[target].del)
  return Promise.all(pack(targets[target].config))
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


