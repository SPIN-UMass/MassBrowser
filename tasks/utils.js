const exec = require('child_process').exec
const treeKill = require('tree-kill')
const { spawn } = require('child_process')
const chalk = require('chalk')
const { say } = require('cfonts')

const YELLOW = '\x1b[33m'
const BLUE = '\x1b[34m'
const END = '\x1b[0m'


const LABEL_DONE = chalk.bgGreen.white(' DONE ') + ' '
const LABEL_ERROR = chalk.bgRed.white(' ERROR ') + ' '
const LABEL_OK = chalk.bgBlue.white(' OKAY ') + ' '

let children = []

function run (command, color, name) {
  return new Promise((resolve, reject) => {
    let child = exec(command)

    child.stdout.on('data', data => {
      console.log(format(name, data, color))
    })

    child.stderr.on('data', data => console.error(format(name, data, color)))
    child.on('exit', code => {
      exit(code)
      if (!code) {
        resolve()  
      } else {
        reject()
      }
    })

    children.push(child)
  })
}

function format (command, data, color) {
  return color + command + END +
    '  ' + // Two space offset
    data.toString().trim().replace(/\n/g, '\n' + repeat(' ', command.length + 2)) +
    ''// '\n'
}

function repeat (str, times) {
  return (new Array(times + 1)).join(str)
}

function exit (code) {
  children.forEach(child => {
    treeKill(child.pid)
  })
}

function greeting (title, titleSplit) {
  const isCI = process.env.CI || false
  const cols = process.stdout.columns
  let text = ''

  if (cols > 85) text = title
  else if (cols > 60) text = titleSplit
  else text = false

  if (text && !isCI) {
    say(text, {
      colors: ['yellow'],
      font: 'simple3d',
      space: false
    })
  } else console.log(chalk.yellow.bold(`\n  ${title}`))
  console.log()
}


module.exports = {
  greeting,
  run,
  format,
  YELLOW,
  BLUE,
  END,
  LABEL_DONE,
  LABEL_OK,
  LABEL_ERROR
}