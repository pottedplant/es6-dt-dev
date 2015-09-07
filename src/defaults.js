import {Tables,Registry,Table,Rows,Slice,Column,Header,Body,Pagination,Controls,} from './core';

export function mapper(row,i,slice,column,body,opts) {
	let name = column.name();
	if( name && (name in row) )
		return row[name];
	
	return null;
}

export function columns_transformer(columns,ordered,table) {
	let r = [];
	
	if( ordered )
		columns = ordered;
	
	columns.forEach(c=>{
		if( c.hidden()!==true )
			r.push(c);
	});
	
	return r;
}

export function sort_manager(column,table) {
	table.columns().forEach(c=>{
		if( c!==column )
			if( c.sortable() && c.allow_no_sort() )
				c.sort(null);
	});
}

export function builder(table,opts) {
	let api = {};
	
	if( table.controllable() )
		api.controls = table.controls();
	
	if( !opts.hide_header )
		api.header = table.header();
	
	api.body = table.body();
	
	if( table.pagination_limit() )
		api.pagination = table.pagination();

	let parts = {};
	
	if( api.controls ) parts.controls = api.controls.dom();
	if( api.header ) parts.header = api.header.dom();
	parts.body = api.body.dom();
	if( api.pagination ) parts.pagination = api.pagination.dom();
	
	let dom = table.renderer()(parts,api,table,opts);
	
	if( !opts.no_fetch ) {
		if( api.pagination )
			api.pagination.show(0);
		else
			table.fetch();
	}
	
	return {
		api: api,
		parts: parts,
		dom: dom,
	};
}

export function setup(registry,renderer_bundle) {
	let r = registry;
	let b = renderer_bundle;
	
	r.set('table',(registry,opts={})=>new Table(registry,opts));
	r.set('column',(table,opts={})=>new Column(table,opts));
	r.set('header',(table,opts={})=>new Header(table,opts));
	r.set('body',(table,opts={})=>new Body(table,opts));
	r.set('pagination',(table,opts={})=>new Pagination(table,opts));
	r.set('controls',(table,opts={})=>new Controls(table,opts));
	
	r.set('header.renderer',b.header);
	
	r.set('table.columns_transformer',columns_transformer);
	r.set('table.renderer',b.table);
	r.set('table.controllable',true);
	r.set('table.pagination_limit',10);
	r.set('table.sort_manager',sort_manager);
	r.set('table.builder',builder);
	
	r.set('controls.renderer',b.controls);
	
	r.set('column.hidden',false);
	r.set('column.sortable',false);
	r.set('column.allow_no_sort',true);
	r.set('column.controllable',true);
	r.set('column.mapper',mapper);
	r.set('column.header_th_renderer',b.header_th);
	r.set('column.header_label_renderer',b.header_label);
	r.set('column.td_renderer',b.td);
	r.set('column.cell_renderer',b.cell);
	r.set('column.value_renderer',b.value);
	r.set('column.sort_renderer',b.header_sort);
	
	r.set('body.renderer',b.body);
	r.set('body.row_renderer',b.row);
	r.set('body.no_rows_renderer',b.no_rows);
	
	r.set('pagination.renderer',b.pagination);
}

export function create_tables(renderer_bundle,registry=null) {
	registry = registry || new Registry();
	setup(registry,renderer_bundle);
	return new Tables(registry);
}

export default create_tables;