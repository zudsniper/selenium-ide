import 'v8-compile-cache'
import 'source-map-support/register'
import { app } from 'electron'
import { autoUpdater } from 'electron-updater'
import { configureLogging, connectSessionLogging } from './log'
import createSession from './session'
import installReactDevtools from './install-react-devtools'
import { isAutomated } from './util'
import fetch from 'electron-fetch'

// whatever
app.commandLine.appendSwitch('remote-debugging-port', '8315')
if (isAutomated) {
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('no-sandbox');
}
// Configure logging
const log = configureLogging()
autoUpdater.logger = log

// Capture and show unhandled exceptions
process.on('unhandledRejection', function handleWarning(reason) {
  console.log('[PROCESS] Unhandled Promise Rejection')
  console.log('- - - - - - - - - - - - - - - - - - -')
  console.log(reason)
  console.log('- -')
})

process.on('uncaughtException', (error) => {
  console.error('Unhandled Error', error)
})

// Function to wait for webpack dev server to be ready in development mode
async function waitForDevServer() {
  const isDev = process.env.SIDE_DEV === '1'
  
  if (!isDev || app.isPackaged) {
    return true // No need to wait in production mode
  }

  console.log('Checking if webpack dev server is ready...')
  
  // Try to connect to the webpack dev server status endpoint
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      const response = await fetch('http://localhost:8083/webpack-dev-server-status')
      if (response.ok) {
        console.log('Webpack dev server is ready!')
        return true
      }
    } catch (err) {
      // Server not ready yet, wait and retry
      await new Promise(resolve => setTimeout(resolve, 500))
      console.log(`Waiting for webpack dev server... (attempt ${attempt + 1})`)
    }
  }
  
  console.error('Timed out waiting for webpack dev server')
  return false
}

// Start and stop hooks
app.on('ready', async () => {
  if (!app.isPackaged && !isAutomated) {
    installReactDevtools()
  }
  
  // Wait for webpack dev server to be ready in development mode
  await waitForDevServer()
  
  const session = await createSession(app)
  connectSessionLogging(session)
  await session.system.startup()

  process.on('SIGINT', () => app.quit())
  app.on('open-file', async (_e, path) => {
    // Instantiate the session
    await session.projects.load(path)
  })

  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  let allWindowsClosed = false

  app.on('activate', async () => {
    if (allWindowsClosed) {
      allWindowsClosed = false
      await session.system.startup()
    }
  })

  app.on('before-quit', async (e) => {
    e.preventDefault()
    const successfulExit = await session.system.beforeQuit()
    if (successfulExit) {
      app.exit(0)
    }
  })

  app.on('window-all-closed', async () => {
    allWindowsClosed = true
    if (process.platform === 'darwin') {
      await session.system.shutdown()
    } else {
      await session.system.quit()
    }
  })

  app.on(
    'certificate-error',
    (event, _webContents, _url, _error, _certificate, callback) => {
      session.state.getUserPrefs().then((userPrefs) => {
        console.log(userPrefs)
        if (
          userPrefs.ignoreCertificateErrorsPref === 'Yes' &&
          _url.startsWith(session.projects.project.url)
        ) {
          event.preventDefault()
          callback(true)
        } else callback(false)
      })
    }
  )
})
