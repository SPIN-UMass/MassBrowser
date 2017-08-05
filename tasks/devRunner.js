var blessed = require('blessed')
const exec = require('child_process').exec
const inquirer = require('inquirer')
const treeKill = require('tree-kill')

let children = []

const TARGET = process.argv[process.argv.length - 1]

if (TARGET !== 'relay' && TARGET !== 'client') {
   console.error("Must specify target")
   process.exit(1)
}

const PORT = TARGET === 'client' ? 9080 : 9081

// Create a screen object.
var screen = blessed.screen({
  smartCSR: true
})

screen.title = 'MassBrowser Dev'

let rendererHotDevProcess
var rendererHotDevPanel = createPanel(
  'Renderer Process - Webpack HotDev', 
  {
    top: 0,
    left: 0,
    width: '50%',
    height: '100%',
  }, 
  [
    {
      label: 'Restart',
      callback: () => {
        rendererHotDevProcess.restart()
      }  
    }
  ]
)

let mainWatchProcess
var mainWatchPanel = createPanel(
  'Main Process - Webpack Watch', 
  {
    top: "50%",
    left: "50%",
    width: '50%',
    height: '53%',
  }, 
  [
    {
      label: 'Restart',
      callback: () => {
        mainWatchProcess.restart()
      }  
    }
  ]
)

let mainProcess
var mainProcessPanel = createPanel(
  'Main Process', 
  {
    top: 0,
    left: "50%",
    width: '50%',
    height: '50%',
  }, 
  [
    {
      label: 'Restart',
      callback: () => {
        mainProcess.restart()
      }  
    }
  ]
)

rendererHotDevProcess = run(
  rendererHotDevPanel, 
  `webpack-dev-server --hot --colors --config tasks/webpack/webpack.${TARGET}.electron.renderer.js --port ${PORT} --content-base app/dist/${TARGET}`,
  data => data.indexOf('Compiled successfully') >= 0
)
mainWatchProcess = run(
  mainWatchPanel, 
  `webpack --watch --colors --config tasks/webpack/webpack.${TARGET}.electron.main.js`
)

Promise.all([rendererHotDevProcess.promise, mainWatchProcess.promise])
.then(() =>  {
  mainProcess = run(
    mainProcessPanel, 
    `cross-env NODE_ENV=development DEV_PORT=${PORT} electron app/dist/${TARGET}/electron.main.js`,
    null,
    'SIGKILL'
  )
})

screen.render()
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  cleanup()
  setTimeout(() => {process.exit(0)}, 300)
  // return process.exit(0)
})

function createPanel(label, layout, controls) {
  var container = blessed.box(Object.assign(layout, {
    label: label,
    draggable: true,
    border: {
      type: 'line'
    },
    fg: 'white'
  }))

  var box = blessed.box({
    parent: container,
    top: 1,
    left: 0,
    width: '95%',
    height: '90%',
    scrollable: true,
    mouse: true,
    tags: true,
    fg: 'white'
  })

  var form = blessed.form({
    parent: container,
    keys: true,
    left: 0,
    bottom: 0,
    width: '95%',
    height: "5%",
  });

  let left = 0
  let btnSize = 10
  let spacing = 10

  controls.forEach(control => {
    var label = control.label
    var callback = control.callback

    var button = blessed.button({
      parent: form,
      mouse: true,
      keys: true,
      shrink: true,
      padding: {
        left: 1,
        right: 1
      },
      left: left,
      bottom: 0,
      height: 1,
      name: label,
      content: label,
      style: {
        bg: 'blue',
        focus: {
          bg: 'red'
        },
        hover: {
          bg: 'red'
        }
      }
    })

    button.on('click', callback)

    left = left + btnSize + spacing
  })

  var updateTimeLabel = blessed.text({
    parent: form,
    padding: {
      left: 1,
      right: 1
    },
    right: 0,
    bottom: 0,
    height: 1,
    content: '',
    bg: 'blue'
  })

  var statusLabel = blessed.text({
    parent: form,
    padding: {
      left: 1,
      right: 1
    },
    right: 20,
    bottom: 0,
    height: 1,
    content: '',
    bg: 'blue'
  })
  
  let lastUpdate = Math.floor(new Date().getTime() / 1000)

  function updateTime() {
    let now = Math.floor(new Date().getTime() / 1000)
    updateTimeLabel.setContent(`${now - lastUpdate} seconds ago`)
  }

  setInterval(() => { updateTime(); screen.render() }, 1000)

  container.setStatus = (status, color) => {
    statusLabel.setContent(status)
    screen.render()
  }

  container.addLine = (line) => {
    box.insertBottom(line)
    box.setScrollPerc(100)
    lastUpdate = Math.floor(new Date().getTime() / 1000)
    updateTime()
    screen.render()
  }

  container.setContent = content => {
    box.setContent(content)
    box.setScrollPerc(100)
    lastUpdate = Math.floor(new Date().getTime() / 1000)
    updateTime()
    screen.render()
  }

  screen.append(container)

  return container
}

function run (panel, command, shouldResolve, killSignal) {
  if (!shouldResolve) {
    shouldResolve = (data) => true
  }

  let child
  let resolved
  let running

  function startProcess() {
    resolved = false
    running = false

    // Promise resolved once process is running and data has been received
    return new Promise((resolve, reject) => {
      child = exec(command)
      child.killSignal = killSignal || 'SIGTERM'

      let allData = ''
      child.stdout.on('data', data => {
        allData += data
        // allData += '\n' + children.map(a => a.pid).toString()
        panel.setContent(allData)

        if (!resolved && shouldResolve(data)) {
          resolve()
          resolved = true
        }

        if (!running) {
          panel.setStatus(`Running [${child.pid}]`)
          running = true
        }
      })

      child.stderr.on('data', data => {
        allData += data
        panel.setContent(allData)
      })

      child.on('exit', code => {
        panel.addLine('')
        panel.setStatus(`Exited ${code}`)
        panel.addLine(`Exited with code ${code}`)
      })

      children.push(child)
    })
  }

  let p = startProcess()

  return {
    promise: p,
    stop: () => {
      treeKill(child.pid, child.killSignal)
      child = null
    },
    restart: () => {
      if (child) {
        var index = children.indexOf(child);
        children.splice(index, 1);
        treeKill(child.pid,  child.killSignal)
        child = null
      }
      return startProcess()
    }
  }
  
}

function cleanup () {
  children.forEach(child => {
    try{ 
      treeKill(child.pid, child.killSignal)
    } catch (e) {
      console.error(e)  
    }
  })
}

// process.on('exit', cleanup);
// process.on('SIGINT', cleanup);
// process.on('uncaughtException', cleanup);
