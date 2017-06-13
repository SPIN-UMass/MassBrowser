process.env.NODE_ENV = 'production'

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


if (process.env.BUILD_TARGET === 'clean') clean()
else prerelease()


function prerelease () {
  greeting()

}


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
