import {signal} from './util';

export class Registry {
	
	constructor(parent=null,values={}) {
		this.parent = parent;
		this.values = values;
	}
	
	child() {
		return new Registry(this);
	}
	
	set(key,value) {
		this.values[key] = value;
		return this;
	}
	
	unset(key) {
		delete this.values[key];
	}
	
	get(key,recursive=true) {
		if( key in this.values )
			return this.values[key];
		
		if( !recursive ) return undefined;
		if( !this.parent ) return undefined;
		return this.parent.get(key);
	}
	
	property(retval,key,...defaults) {
		
		// defaults
		if( !(key in this.values) )
			for(let i=0;i<defaults.length;++i)
				if( defaults[i]!==undefined ) {
					this.values[key] = defaults[i];
					break;
				}
		
		let changed_signal = signal();
		
		// property
		let p = (value)=>{
			if( value!==undefined ) {
				this.set(key,value);
				changed_signal(value);
				return retval;
			}
			
			return this.get(key);
		};
		
		p.changed = changed_signal;
		return p;
	}
	
}

