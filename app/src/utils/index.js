import path from 'path'

export function getDataDir () {
  return path.join(process.env.HOME, '.yaler')
}
