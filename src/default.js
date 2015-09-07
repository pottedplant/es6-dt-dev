import {Tables,Registry,Table,Rows,Slice,Column,Header,Body,Pagination,Controls,} from './core';

export default function create_default_tables(renderer_bundle) {
	let r = new Registry();
	let b = renderer_bundle;
	
	let default_mapper = (row,i,slice,column,body,opts) => {
		let name = column.name();
		if( name && (name in row) )
			return row[name];
		
		return null;
	};
	
	let default_columns_transformer = (columns,ordered,table) => {
		let r = [];
		
		if( ordered )
			columns = ordered;
		
		columns.forEach(c=>{
			if( c.hidden()!==true )
				r.push(c);
		});
		
		return r;
	}
	
	let default_sort_manager = (column,table) => {
		table.columns().forEach(c=>{
			if( c!==column )
				c.sort(null);
		});
	};
	
	r.set('table',(registry,opts={})=>new Table(registry,opts));
	r.set('column',(table,opts={})=>new Column(table,opts));
	r.set('header',(table,opts={})=>new Header(table,opts));
	r.set('body',(table,opts={})=>new Body(table,opts));
	r.set('pagination',(table,opts={})=>new Pagination(table,opts));
	r.set('controls',(table,opts={})=>new Controls(table,opts));
	
	r.set('header.renderer',b.header);
	
	r.set('table.columns_transformer',default_columns_transformer);
	r.set('table.renderer',b.table);
	r.set('table.controllable',true);
	r.set('table.pagination_limit',10);
	r.set('table.sort_manager',default_sort_manager);
	
	r.set('controls.renderer',b.controls);
	
	r.set('column.hidden',false);
	r.set('column.sortable',false);
	r.set('column.controllable',true);
	r.set('column.mapper',default_mapper);
	r.set('column.header_renderer',b.header_cell);
	r.set('column.cell_renderer',b.cell);
	r.set('column.sort_renderer',b.header_sort);
	
	r.set('body.renderer',b.body);
	r.set('body.row_renderer',b.row);
	r.set('body.no_rows_renderer',b.no_rows);
	
	r.set('pagination.renderer',b.pagination);
	
	return new Tables(r);
}
