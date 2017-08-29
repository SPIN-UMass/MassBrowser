import axios from 'axios'
import { error } from '@utils/log'

export function getLocationForIP(ipAddress) {
  return axios.get(`http://freegeoip.net/json/${ipAddress}`)
  .catch(err => error(err))
  .then(response => response.data)
}

export function getMyIP() {
  return axios.get(`https://api.ipify.org/?format=json`)
  .catch(err => error(err))
  // .then(response => response.data.ip)
  .then(response => '2.144.100.100')
}