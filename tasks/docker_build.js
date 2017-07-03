const inquirer = require('inquirer')
const fs = require('fs-extra')
const chalk = require('chalk')
const child_process = require('child_process')

function run(command, options) {
  var parts = command.split(' ')
  var command = parts[0]
  var args = parts.splice(1)
  return new Promise((resolve, reject) => {
    var child = child_process.spawn(
        command,
        args, 
        options
    )

    child.stdout.on('data', data => {
      process.stdout.write(chalk.magenta(data.toString()))
    })

    child.stderr.on('data', data => {
      process.stdout.write(chalk.red(data.toString()))
    })

    child.on('exit', code => {
      if (code === 0) {
        resolve()
      } else {
        reject()
      }
    })
  })
}

function initializeDockerBuild() {
  console.log(chalk.green.bold("Initializing Docker build"))

  return fs.readJson('app/package.json')
  .then(packageJson => {
    /* Disable nat in package.json */

    if (packageJson.config.relay.natEnabled) {
      return inquirer.prompt([{
        type: 'confirm',
        name: 'disableNat',
        message: 'Docker build does not work with NAT, disable NAT?'
      }])
      .then(answer => {
        if (answer.disableNat) {
          return packageJson
        } else {
          process.exit(0)
        }
      })
    } else {
      return packageJson
    }
  })
  .then(packageJson => {
    /* Set relay port in package.json */

    packageJson.config.relay.natEnabled = false
    let defaultPort = packageJson.config.relay.port
    return inquirer.prompt([{
      name: 'port',
      message: 'Enter the port relays would be run on',
      default: defaultPort,
      validate: port => /^[0-9]+$/.test(port) || 'Invalid port'
    }])
    .then(answer => {
      packageJson.config.relay.port = answer.port
      return packageJson
    })
  })
  .then(packageJson => {
    /* Write modified package.json to docker directory  */

    packageJson.main = 'relay.js'
    packageJson.scripts = {
      start: 'node relay.js'
    }
    return fs.writeJson('docker/package.json', packageJson, { spaces: 2 })
    .then(() => packageJson.config)
  })
  .then(config => {
    /* Copy relay.js from dist  */

    return fs.copy('app/dist/relay.js', 'docker/relay.js')
    .then(() => config)
  })
}

function buildDockerImage(config) {
  console.log(chalk.green.bold("Building Docker Image"))

  return inquirer.prompt([{
    name: 'imageName',
    message: 'Enter Docker image name',
    default: 'relay'
  }])
  .then(answer => answer.imageName)
  .then(imageName => {
    config.imageName = imageName
    return imageName
  })
  .then(imageName => run(`docker build -t ${imageName} --build-arg relay_port=${config.relay.port} .`, {cwd: 'docker'}))
  .then(() => config)
}

function publishImage(config) {
  return inquirer.prompt([{
    type: 'confirm',
    name: 'shouldPublish',
    message: 'Would you like to publish the image?'
  }])
  .then(answer => answer.shouldPublish)
  .then(shouldPublish => {
    if (!shouldPublish) {
      return
    }

    return inquirer.prompt([
      {
        name: 'username',
        message: 'Enter docker username',
        default: 'yaler',
      },
      {
        name: 'password',
        message: 'Enter docker password'
      },
      {
        name: 'repository',
        message: 'Enter docker repository',
        default: 'relay',
      },
      {
        name: 'tag',
        message: 'Enter image tag name',
        default: config.sentry.version
      }
    ])
    .then(dockerConfig => {
      return run(`docker login -u ${dockerConfig.username} -p ${dockerConfig.password}`)
      .then(() => dockerConfig)
    })
    .then(dockerConfig => {
      return run(`docker tag ${config.imageName} ${dockerConfig.username}/${dockerConfig.repository}:${dockerConfig.tag}`)
      .then(() => run(`docker tag ${config.imageName} ${dockerConfig.username}/${dockerConfig.repository}:latest`))
      .then(() => dockerConfig)
    })
    .then(dockerConfig => {
      return run(`docker push ${dockerConfig.username}/${dockerConfig.repository}:${dockerConfig.tag}`)
      .then(() => run(`docker push ${dockerConfig.username}/${dockerConfig.repository}:latest`))
      .then(() => dockerConfig)
    })
  })
}

initializeDockerBuild()
.then(buildDockerImage)
.then(publishImage)
.catch(err => {
  console.error(err)
})