import {signal} from './util';
import {Registry} from './registry';

export class Tables extends Registry {
	
	constructor(parent) {
		super(parent);
	}
	
	table(...params) { return this.get('table')(this,...params); }
	rows(data,offset=0,total=null,has_more=null) { return Rows.of(Slice.of(data,offset,total,has_more)); }
	
	clone() {
		return new Tables(this.parent);
	}
	
}

export class Slice {
	
	constructor(data,offset,total,has_more) {
		this.data = data;
		this.offset = offset;
		this.total = total;
		this.has_more = has_more;
	}
	
	static of(data,offset=0,total=null,has_more=null) {
		return new Slice(data,offset,total,has_more);
	}
	
}

export class Rows {
	
	constructor(slice) {
		this.slice = slice;
	}
	
	windowed(window) {
		let slice = this.slice;
		if( !window ) return slice;
		
		let data = slice.data.slice(window.offset-slice.offset);
		let has_more = slice.has_more || data.length>window.limit || ( slice.total!=null && slice.total>(slice.offset+slice.data.length) );
		
		data = data.slice(0,window.limit);
		return Slice.of(data,window.offset,slice.total,has_more);
	}
	
	static of(slice) {
		return new Rows(slice);
	}
}

export class Window {
	
	constructor(offset,limit) {
		this.offset = offset;
		this.limit = limit;
	}
	
	static of(offset,limit) {
		return new Window(offset,limit);
	}
	
}

export class Table {
	
	constructor(registry,opts={}) {
		this.opts = opts;
		this.registry = registry = registry.child();
		this.request_id = 0;
		
		this.classes = registry.property(this,'table.classses',opts.classes);
		this.columns = registry.property(this,'table.columns',opts.columns,[]);
		this.columns_transformer = registry.property(this,'table.columns_transformer',opts.columns_transformer);
		this.rows = registry.property(this,'table.rows',opts.rows,Rows.of(Slice.of([])));
		this.window = registry.property(this,'table.window',opts.window);
		this.renderer = registry.property(this,'table.renderer',opts.renderer);
		this.fetcher = registry.property(this,'table.fetcher',opts.fetcher);
		this.controllable = registry.property(this,'table.controllable',opts.controls);
		this.sort_manager = registry.property(this,'table.sort_manager',opts.sort_manager);
		this.builder = registry.property(this,'table.builder',opts.builder);
		
		this.columns_order = registry.property(this,'table.columnds_order',opts.columns_order);
		this.pagination_limit = registry.property(this,'table.pagination_limit',opts.pagination_limit);
		
		this.redraw_body = signal(this);
		this.redraw_header = signal(this);
		this.redraw_pagination = signal(this);
		this.redraw_controls = signal(this);
		
		this.column_sort_changed = signal(this);
		
		this.fetching = registry.property(this,'table.fetching');
		
		this.column_sort_changed.attach(column=>this.sort_manager()(column,this));
	}
	
	column(...params) {
		let column = this.registry.get('column')(this,...params);
		this.columns().push(column);
		return column;
	}
	
	data(data) {
		this.rows(Rows.of(Slice.of(data,0,data.length,false)));
	}
	
	data_window(offset,limit) {
		this.window(Window.of(offset,limit));
	}
	
	fetch() {
		let fetcher = this.fetcher();
		if( !fetcher ) {
			this.redraw_body();
			this.redraw_pagination();
			return;
		}
		
		let request_id = ++this.request_id;
		let window = this.window();
		let sort = [];
		
		this.visible_columns().forEach(c=>{
			if( !c.sortable() ) return;
			switch( c.sort() ) {
			case undefined:
			case null: return;
			default: sort.push({ order:c.sort(), name:c.name(), column_index:c.index(), });
			}
		});
		
		let request_offset = 0;
		let request_limit;

		if( window ) {
			request_offset = window.offset;
			request_limit = window.limit;
		}

		this.fetching(true);
		fetcher(request_offset,request_limit,sort,window).then(r=>{
			if( this.request_id!=request_id ) return;
			
			let offset = request_offset;
			if( r.offset!=null ) offset = r.offset;
			
			let slice = Slice.of(r.data,offset,r.total,r.has_more);
			this.rows(Rows.of(slice));
			
			this.redraw_body();
			this.redraw_pagination();
			this.fetching(false);
		});
	}

	verified_columns_order() {
		let columns = this.columns();
		let order = this.columns_order();
		
		if( order && order.length==columns.length && columns.every(a=>order.indexOf(a)!=-1) )
			return order;
	}

	visible_columns() {
		return this.columns_transformer()(this.columns(),this.verified_columns_order(),this); 
	}
	
	header(...params) { return this.registry.get('header')(this,...params); }
	body(...params) { return this.registry.get('body')(this,...params); }
	pagination(...params) { return this.registry.get('pagination')(this,...params); }
	controls(...params) { return this.registry.get('controls')(this,...params); }
	
	build(opts={}) { return this.builder()(this,opts); }
	
}

export class Column {
	
	constructor(table,opts={}) {
		
		this.opts = opts;
		this.table = table;
		this.registry = table.registry.child();
		let r = this.registry;
		
		this.name = r.property(this,'column.name',opts.name);
		this.label = r.property(this,'column.label',opts.label);
		this.classes = r.property(this,'column.classes',opts.classes);
		this.hidden = r.property(this,'column.hidden',opts.hidden);
		this.sortable = r.property(this,'column.sortable',opts.sortable);
		this.allow_no_sort = r.property(this,'column.allow_no_sort',opts.allow_no_sort);
		this.sort = r.property(this,'column.sort',opts.sort);
		this.controllable = r.property(this,'column.controllable',opts.reorderable);
		this.minimize = r.property(this,'column.minimize',opts.minimize);
		
		this.mapper = r.property(this,'column.mapper',opts.mapper);
		this.header_th_renderer = r.property(this,'column.header_th_renderer',opts.header_th_renderer);
		this.header_label_renderer = r.property(this,'column.header_label_renderer',opts.header_label_renderer);
		this.td_renderer = r.property(this,'column.td_renderer',opts.td_renderer);
		this.cell_renderer = r.property(this,'column.cell_renderer',opts.cell_renderer);
		this.value_renderer = r.property(this,'column.value_renderer',opts.value_renderer);
		this.sort_renderer = r.property(this,'column.sort_renderer',opts.sort_renderer);
		
	}
	
	index() {
		let columns = this.table.columns();
		for(let i=0;i<columns.length;++i)
			if( columns[i]===this )
				return i;
		
		return null;
	}
	
}

export class Header {
	
	constructor(table,opts={}) {
		this.opts = opts;
		this.table = table;
		this.registry = table.registry.child();
		let r = this.registry;
		
		this.renderer = r.property(this,'header.renderer',opts.renderer);
		
		this.redraw = signal(this).inject((c,...args)=>c(this,this.table.visible_columns(),opts,...args));
		table.redraw_header.attach(this.redraw);
	}
	
	dom(opts={}) { return this.renderer()(this,this.table.visible_columns(),opts); }
	
}

export class Body {
	
	constructor(table,opts={}) {
		this.opts = opts;
		this.table = table;
		this.registry = table.registry.child();
		let r = this.registry;
		
		this.renderer = r.property(this,'body.renderer',opts.renderer);
		this.row_renderer = r.property(this,'body.row_renderer',opts.row_renderer);
		this.no_rows_renderer = r.property(this,'body.no_rows_renderer',opts.no_rows_renderer);
		
		this.redraw = signal(this).inject((c,...args)=>c(this,this.table.visible_columns(),this.table.rows().windowed(this.table.window()),opts,...args));
		table.redraw_body.attach(this.redraw);
	}
	
	dom(opts={}) { return this.renderer()(this,this.table.visible_columns(),opts); }
	
}

export class Controls {
	
	constructor(table,opts={}) {
		this.opts = opts;
		this.table = table;
		this.registry = table.registry.child();
		let r = this.registry;
		
		this.renderer = r.property(this,'controls.renderer',opts.renderer);
		
		this.redraw = signal(this).inject((c,...args)=>c(this,this.table.columns(),this.table.verified_columns_order(),opts,...args));
		
		table.redraw_controls.attach(this.redraw);
	}
	
	dom(opts={}) { return this.renderer()(this,opts); }
	
}

export class Pagination {
	
	constructor(table,opts={}) {
		this.opts = opts;
		this.table = table;
		this.registry = table.registry.child();
		let r = this.registry;
		
		this.renderer = r.property(this,'pagination.renderer',opts.renderer);
		this.limit = (...args)=>table.pagination_limit(...args);
		
		this.redraw = signal(this).inject((c,...args)=>c(this,this.info(),opts,...args));
		table.redraw_pagination.attach(this.redraw);
		table.fetching.changed.attach(this.redraw);
	}
	
	show(page) {
		let table = this.table;
		let limit = this.limit();
		
		let window = Window.of(page*limit,limit);
		table.window(window);
		
		table.fetch();
		return this;
	}
	
	info() {
		let table = this.table;
		let window = table.window();
		let slice = table.rows().windowed(window);
		let limit = this.limit();
		
		let page = slice.offset/limit;
		let has_more = slice.has_more;
		let pages;
		
		if( slice.total ) pages = Math.max(0,parseInt((slice.total-1)/limit));
		return {page,pages,has_more};
	}
	
	dom(opts={}) { return this.renderer()(this,opts); }
	
}
