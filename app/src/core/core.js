import { increment } from '../actions/counter';
import { runtestserver } from './server/TLSReceiver';

export class YalerCore {
  store;

  constructor(store) {
    this.store = store;
  }

  start() {

    // setInterval(() => {
    //   this.store.dispatch(increment());
    // }, 1000)
  }
}

