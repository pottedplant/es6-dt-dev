
export let tag = (name,attrs,...children) => {
	let r = document.createElement(name);
	
	if( attrs )
		Object.keys(attrs).forEach((key)=>r.setAttribute(key,attrs[key]));
	
	children.forEach(child=>r.appendChild(child));
	return r;
};

export let remove_children = e => {
	while( e.firstChild!=null )
		e.removeChild(e.firstChild);
};

export let text = text => document.createTextNode(text);
