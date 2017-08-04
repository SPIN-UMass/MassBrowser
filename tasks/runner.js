'use strict'

// const config = require('../config')
const exec = require('child_process').exec
const treeKill = require('tree-kill')
const inquirer = require('inquirer')

let YELLOW = '\x1b[33m'
let BLUE = '\x1b[34m'
let END = '\x1b[0m'

let isElectronOpen = false

const port = Math.ceil(Math.random() * 5000 + 5000)

function format (command, data, color) {
  return color + command + END +
    '  ' + // Two space offset
    data.toString().trim().replace(/\n/g, '\n' + repeat(' ', command.length + 2)) +
    ''// '\n'
}

function repeat (str, times) {
  return (new Array(times + 1)).join(str)
}

let children = []

function run (target, command, color, name) {
  let child = exec(command)

  // child.stdout.on('data', data => {
  //   console.log(format(name, data, color))

  //   /**
  //    * Start electron after successful compilation
  //    * (prevents electron from opening a blank window that requires refreshing)
  //    */
  //   if (/Compiled/g.test(data.toString().trim().replace(/\n/g, '\n' + repeat(' ', command.length + 2))) && !isElectronOpen) {
  //     console.log(`${BLUE}Starting electron...\n${END}`)
  //     run(target, `cross-env NODE_ENV=development DEV_PORT=${port} electron app/dist/client/electron.main.js`, BLUE, 'electron')
  //     isElectronOpen = true
  //   }
  // })

  child.stderr.on('data', data => console.error(format(name, data, color)))
  child.on('exit', code => exit(code))

  children.push(child)
}

function exit (code) {
  children.forEach(child => {
    treeKill(child.pid)
  })
}

// function runForTarget(target) {
//   console.log(`${YELLOW}Starting ${target} webpack-dev-server...\n${END}`)
//   run(target, `webpack-dev-server --hot --colors --config tasks/webpack/webpack.${target}.electron.renderer.js --port ${port} --content-base app/dist/${target}`, YELLOW, 'webpack')
// }


// let t = process.argv[process.argv.length - 1]
// if (t === 'relay' || t === 'client') {
//    runForTarget(t)
// } else {
//   inquirer.prompt([
//     {
//       type: 'list',
//       name: 'target',
//       message: 'Which target do you want to run?',
//       choices: ['client', 'relay']
//     }
//   ])
//   .then(answers => answers.target)
//   .then(target => runForTarget(target))
// }

run('client', `cross-env NODE_ENV=development DEV_PORT=9080 electron app/dist/client/electron.main.js`, BLUE, 'electron')