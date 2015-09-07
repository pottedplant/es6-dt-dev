
export function signal (retval) {
	let r = (...args)=>r.fire(args);
	let l = [];
	
	let c = [
		(n,...args) => { l.slice(0).forEach(l=>l(...args)); }
	];
	
	r.inject = (f) => { c.push(f); return r; };
	
	r.fire = (args) => {
		for(let i=c.length-1;i>=0;--i)
			c[i]((...t)=>(args=t),...args);
		
		return retval; 
	}
	
	r.attach = (f) => {
		l.push(f);
		let bound = true;
		
		return {
			detach: ()=>{
				if( !bound ) return;
				bound = false;
				l.some((g,i)=>{
					if( f!==g ) return false;
					l.splice(i,1); return true;
				});
			}
		};
	};
	
	return r;
};
