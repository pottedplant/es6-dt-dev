import {text} from './dom';

export function value_renderer(value,column,body,opts) {
	if( value!=null )
		return text(value);
}

