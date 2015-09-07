import {text} from './dom';

export function value_renderer(value,column,row,body,opts) {
	if( value!=null )
		return text(value);
}

