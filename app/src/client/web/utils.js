import { getDataDir } from '../../utils'
import path from 'path'

/**
 * https://stackoverflow.com/questions/2400935/browser-detection-in-javascript
 */
export function getBrowser() {
  var ua= navigator.userAgent, tem,
  M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
  if(/trident/i.test(M[1])){
      tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
      return 'IE '+(tem[1] || '');
  }
  if(M[1]=== 'Chrome'){
      tem= ua.match(/\b(OPR|Edge)\/(\d+)/);
      if(tem!= null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
  }
  M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
  if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
  return M[0].toLowerCase()
}

export function installCert() {
  let certsPath = path.join(getDataDir(), '/certs/ca.pem');
  let certName = 'MassBrowser';
  let certDirectory = '';


  //
  // certdir=$(dirname ${certDB});
  // certutil -A -n "${certificateName}" -t "TCu,Cu,Tu" -i ${certificateFile} -d sql:${certdir} --empty-password
}
