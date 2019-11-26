import Vue from 'vue';

function randID () {
  return (((1+Math.random())*0x10000)|0).toString(16).substring(1)
}

export const Bus = new Vue();


export function showConfirmDialog(title, text, options) {
  return new Promise((resolve, reject) => {
    let id = randID()

    Bus.$emit('modal-confirm-dialog', {
      title,
      text,
      options,
      id
    })

    Bus.$once(`modal-response-${id}`, response => {
      if (response.error) {
        return reject(response.error)
      }
      return resolve(response.response)
    })
  })
}

export function getAddress (domain) {
  const dns = require('dns')
  dns.lookup(domain, function (err, result) {
    if (err) {
      console.log(err)
      return null
    } else {
      return result
    }
  })
}
