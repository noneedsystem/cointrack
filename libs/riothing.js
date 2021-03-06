function Riothing(cfg){

  riot.observable(this);

  this.actions = {};
  this.actionNames = [];
  this.stores = {};
  this.storeNames = [];

  init.bind(this)(cfg);

  this.store  = (storeName)   => this.stores[storeName];
  this.action = (actionName)  => this.actions[actionName];
  this.act = (actionName, payload, cb) => this.actions[actionName] && this.actions[actionName](payload, cb);

  this.track = this.on;

  function init({ viewFilePath, actions, stores }){
    const self = this;
    //init actions & stores
    initActions.bind(this)(actions);
    initStores.bind(this)(stores);

    //init views
    fetch(chrome.extension.getURL(viewFilePath))
      .then(res   => res.text())
    	.then(html 	=> {

    		//Compile and mount tags
        html = riot.compile(html, true);
    		eval(html);
    		riot.mixin('riothing', riothingMixin(self));
    		riot.mount('*');

    		//Generate styling
    		fucss.glob = false;
    		return fucss.generateStyling({ riot: html, returnStyle: false })
    	})
  }

  function initStores(stores){
    for(let storeName in stores){
      this.stores[storeName] = new riothingStore(storeName, stores[storeName], this);
      this.storeNames.push(storeName);
    }
  }

  function initActions(actions){
    for(let actionName in actions){
      this.actions[actionName] = actions[actionName].bind(this);
      this.actionNames.push(actionName);
    }
  }

  console.log(this);

  function riothingMixin(self){
    console.log('init Mixin');
    return {
      init: function(){
        this.store  = self.store;
        this.action = self.action;
        this.act    = self.act;
        this.track  = self.track;
      }
    }
  }

  function riothingStore(name, { state, model, actions }, self){

    this.name         = name;
    this.model        = model;
    this.state        = state || {};
    this.actions      = {};
    this.actionNames  = [];
    this.trigger      = self.trigger;

    initStore.bind(this)({ actions });

    this.get = (key) => key
      ? key.split('.').reduce((o,i) => o[i], this.state)
      : this.state;

    this.set = (data, triggerName) => {
      Object.assign(this.state, model && new model(data) || data)
      triggerName && self.trigger(triggerName, this.state);
      return this.state;
    }

    this.restate = (data, triggerName) => {
      this.state = model && new model(data) || data;
      triggerName && self.trigger(triggerName, this.state);
      return this.state;
    }

    this.act = (actionName, payload, cb) => this.actions[actionName] && this.actions[actionName](payload, cb);

    function initStore({ actions }){
      for(let actionName in actions){
        this.actions[actionName] = actions[actionName].bind(this);
        this.actionNames.push(actionName);
      }
    }
  }
}

const intervals = [
  { label: 'year', seconds: 31536000 },
  { label: 'month', seconds: 2592000 },
  { label: 'day', seconds: 86400 },
  { label: 'hour', seconds: 3600 },
  { label: 'minute', seconds: 60 },
  { label: 'second', seconds: 0 }
];

function timeSince(timestamp = 0){
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  const interval = intervals.find(i => i.seconds < seconds);
  const count = Math.floor(seconds / interval.seconds);
  return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
}
//
// function globalMixin(stores){
//   return {
//     init: function(){
//       //this.opts.SERVER           = typeof window === 'undefined';
//
//       this.ACTION = (actionName, payload, cb) => {
//         let action = null;
//
//         for(let storeName in stores){
//           if(typeof stores[storeName][actionName] === 'function'){
//             action = stores[storeName][actionName];
//             break;
//           }
//         }
//         console.log(action);
//         // if(typeof this.store[name] !== 'function')
//         //   console.log(`ACTION ${name} does not exist`);
//       }
//
//       this.ACTION('setOpts', { poinject: [], content: {} });
//     }
//   }
// };
