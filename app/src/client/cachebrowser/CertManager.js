/**
 * Created by milad on 5/30/17.
 */

var fs = require('fs')
var path = require('path')
var Forge = require('node-forge')
var pki = Forge.pki
var crypto = require('crypto')
var mkdirp = require('mkdirp')
var async = require('async')

import { getDataDir } from '~/utils'

var CAattrs = [{
  name: 'commonName',
  value: 'UOIS'
}, {
  name: 'countryName',
  value: 'US'
}, {
  shortName: 'ST',
  value: 'MA'
}, {
  name: 'localityName',
  value: 'Amherst'
}, {
  name: 'organizationName',
  value: 'UMASS MILAD HADI'
}, {
  shortName: 'OU',
  value: 'SPIN'
}]

var CAextensions = [{
  name: 'basicConstraints',
  cA: true
}, {
  name: 'keyUsage',
  keyCertSign: true,
  digitalSignature: true,
  nonRepudiation: true,
  keyEncipherment: true,
  dataEncipherment: true
}, {
  name: 'extKeyUsage',
  serverAuth: true,
  clientAuth: true,
  codeSigning: true,
  emailProtection: true,
  timeStamping: true
}, {
  name: 'nsCertType',
  client: true,
  server: true,
  email: true,
  objsign: true,
  sslCA: true,
  emailCA: true,
  objCA: true
}, {
  name: 'subjectKeyIdentifier'
}]

var ServerAttrs = [{
  name: 'countryName',
  value: 'US'
}, {
  shortName: 'ST',
  value: 'MA'
}, {
  name: 'localityName',
  value: 'Amherst'
}, {
  name: 'organizationName',
  value: 'UMASS HADI MILAD'
}, {
  shortName: 'OU',
  value: 'SPIN'
}]

var ServerExtensions = [{
  name: 'basicConstraints',
  cA: false
}, {
  name: 'keyUsage',
  keyCertSign: false,
  digitalSignature: true,
  nonRepudiation: false,
  keyEncipherment: true,
  dataEncipherment: true
}, {
  name: 'extKeyUsage',
  serverAuth: true,
  clientAuth: true,
  codeSigning: false,
  emailProtection: false,
  timeStamping: false
}, {
  name: 'nsCertType',
  client: true,
  server: true,
  email: false,
  objsign: false,
  sslCA: false,
  emailCA: false,
  objCA: false
}, {
  name: 'subjectKeyIdentifier'
}]

class _CertificateManager {
  constructor () {
    this.certspath = path.join(getDataDir(), '/certs')
    this.keypath = path.join(this.certspath, '/keys')
    this.CAcert = undefined
    this.CAkeys = {}
    this.certCache = {}
  }

  initializeCA () {
    return new Promise((resolve, reject) => {
      fs.exists(path.join(this.certspath, 'ca.pem'), (exists) => {
        if (exists) {
          console.log('loading CA')
          this.loadCA(resolve)
        } else {
          console.log('generating CA')
          this.generateCA(resolve)
        }
      })
    })
  }

  getServerCerts (host) {
    return new Promise((resolve, reject) => {
      if (host in this.certCache) {
        resolve(this.certCache[host])
      }

      this.generateServerCerts(host).then((data) => {
        console.log('certs generated')
        this.certCache[host] = {
          cert: data[0],
          key: data[1]
        }
        resolve(this.certCache[host])
      })
    })
  }

  generateServerCerts (host) {
    return new Promise((resolve, reject) => {
      var hosts = [host]
      var mainHost = host
      var keysServer = pki.rsa.generateKeyPair(1024)
      var certServer = pki.createCertificate()
      certServer.publicKey = keysServer.publicKey
      certServer.serialNumber = this.randomSerialNumber()
      certServer.validity.notBefore = new Date()
      certServer.validity.notBefore.setDate(certServer.validity.notBefore.getDate() - 1)
      certServer.validity.notAfter = new Date()
      certServer.validity.notAfter.setFullYear(certServer.validity.notBefore.getFullYear() + 2)
      var attrsServer = ServerAttrs.slice(0)
      attrsServer.unshift({
        name: 'commonName',
        value: mainHost
      })
      certServer.setSubject(attrsServer)
      certServer.setIssuer(this.CAcert.issuer.attributes)
      certServer.setExtensions(ServerExtensions.concat([{
        name: 'subjectAltName',
        altNames: hosts.map((host) => {
          if (host.match(/^[\d\.]+$/)) {
            return {type: 7, ip: host}
          }
          return {type: 2, value: host}
        })
      }]))
      certServer.sign(this.CAkeys.privateKey, Forge.md.sha256.create())
      var certPem = pki.certificateToPem(certServer)
      var keyPrivatePem = pki.privateKeyToPem(keysServer.privateKey)
      var keyPublicPem = pki.publicKeyToPem(keysServer.publicKey)
      // fs.writeFile(this.certspath + '/' + mainHost.replace(/\*/g, '_') + '.pem', certPem, function (error) {
      //   if (error) console.error('Failed to save certificate to disk in ' + this.certspath, error)
      // })
      // fs.writeFile(this.keypath + '/' + mainHost.replace(/\*/g, '_') + '.key', keyPrivatePem, function (error) {
      //   if (error) console.error('Failed to save private key to disk in ' + this.keypath, error)
      // })
      // fs.writeFile(this.keypath + '/' + mainHost.replace(/\*/g, '_') + '.public.key', keyPublicPem, function (error) {
      //   if (error) console.error('Failed to save public key to disk in ' + this.keypath, error)
      // })

      // returns synchronously even before files get written to disk
      resolve([certPem, keyPrivatePem])
    })
  }

  generateCA () {
    pki.rsa.generateKeyPair({bits: 2048}, (err, keys) => {
      if (err) {
        console.log('error generating CA', err)
        return
      }
      let cert = pki.createCertificate()
      cert.publicKey = keys.publicKey
      cert.serialNumber = this.randomSerialNumber()
      cert.validity.notBefore = new Date()
      cert.validity.notBefore.setDate(cert.validity.notBefore.getDate() - 1)
      cert.validity.notAfter = new Date()
      cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10)
      cert.setSubject(CAattrs)
      cert.setIssuer(CAattrs)
      cert.setExtensions(CAextensions)
      cert.sign(keys.privateKey, Forge.md.sha256.create())
      this.CAcert = cert
      this.CAkeys = keys
      console.log('CA generated', path.join(this.certspath, 'ca.pem'))
      mkdirp(this.keypath, (err) => {
        if (err) console.log(err)
        fs.writeFile(path.join(this.certspath, 'ca.pem'), pki.certificateToPem(cert))
        fs.writeFile(path.join(this.keypath, 'ca.private.key'), pki.privateKeyToPem(keys.privateKey))
        fs.writeFile(path.join(this.keypath, 'ca.public.key'), pki.publicKeyToPem(keys.publicKey))
      })
    })
  }

  randomSerialNumber () {
    var sn = ''
    for (var i = 0; i < 4; i++) {
      sn += ('00000000' + Math.floor(Math.random() * Math.pow(256, 4)).toString(16)).slice(-8)
    }
    return sn
  }

  loadCA (onload) {
    this.CAcert = pki.certificateFromPem(fs.readFileSync(path.join(this.certspath, 'ca.pem'), 'utf-8'))
    this.CAkeys = {
      privateKey: pki.privateKeyFromPem(fs.readFileSync(path.join(this.keypath, 'ca.private.key'), 'utf-8')),
      publicKey: pki.publicKeyFromPem(fs.readFileSync(path.join(this.keypath, 'ca.public.key'), 'utf-8'))

    }
    console.log('CA LOADED')
    onload()
  }
}

var CertificateManager = new _CertificateManager()
export default CertificateManager