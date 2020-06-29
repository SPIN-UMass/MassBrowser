import path from 'path'

export function getDataDir () {
  return process.platform === 'win32' ?
    path.join(process.env.LOCALAPPDATA, 'MassBrowser') : path.join(process.env.HOME, '.massbrowser')
}

export const WINDOWS = 'win32'
export const LINUX = 'linux'
export const OSX = 'darwin'

export function isPlatform(platform) {
  return process.platform === platform
}

// https://github.com/sindresorhus/pretty-bytes
const UNITS = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
export function prettyBytes(num) {
	if (!Number.isFinite(num)) {
		// throw new TypeError(`Expected a finite number, got ${typeof num}: ${num}`)
		return '-'
	}

	const neg = num < 0

	if (neg) {
		num = -num
	}

	if (num < 1) {
		return (neg ? '-' : '') + num + ' B'
	}

	const exponent = Math.min(Math.floor(Math.log10(num) / 3), UNITS.length - 1)
	const numStr = Number((num / Math.pow(1000, exponent)).toPrecision(3))
	const unit = UNITS[exponent]

	return (neg ? '-' : '') + numStr + ' ' + unit
}

export function sleep(amount) {
	return new Promise((resolve, _) => {
		setTimeout(resolve, amount)
	})
}

const throttleMap = {}
export function throttleCall (key, time, func) {
	const info = throttleMap[key]
	const now = (new Date()).getTime()
	if (!info || (now - info.start) >= time) {
		throttleMap[key] = {
			start: now,
			callScheduled: false
		}
		func()
		return
	}

	if (!info.callScheduled) {
		info.callScheduled = true
		setTimeout(() => {
			delete throttleMap[key]
			func()
		}, time - (now - info.start))
	}
}
