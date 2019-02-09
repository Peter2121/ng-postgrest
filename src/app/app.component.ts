import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { PostgrestServiceService } from './services/postgrest-service.service';
import { Properties } from './static/Properties';
import * as $ from 'jquery';

declare var swal: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app';

  public databaseUrls: { url: string; auth: string }[] = [];
  public currentUrl: { url: string; auth: string } = { url: '', auth: '' };

  public newUrl: { url: string; auth: string } = { url: '', auth: '' };

  public tables: { name: string; pkey: string }[] = [];

  public table: { name: string; pkey: string } = { name: '', pkey: '' };
  public limit = 100;
  public offset = 0;
  public order = '';

  public busy = false;
  public busyMessage = '';

  public tableColumns: string[] = [];
  public tableRows: any[] = [];
  public tableRowToEdit: any;
  public tableRowToEditOriginal: any;
  public editing = false;

  public MESSAGE_LOADING_TABLES = 'Loading TABLES';
  public MESSAGE_LOADING_ROWS = 'Loading ROWS';

  public inserting = false;

  constructor(private _postgrestService: PostgrestServiceService) {}

  ngOnInit() {
    const result: string = localStorage.getItem('databaseUrls');
    if (result) {
      this.databaseUrls = JSON.parse(result);
      this.currentUrl = this.databaseUrls[0];
      this.refreshListOfTables();
    }
  }

  public getRange(): string {
    if (this.offset === 0) {
      return (
        'Rows ' +
        (this.offset + 1) +
        ' to ' +
        (this.offset + this.tableRows.length)
      );
    }
    return (
      'Rows ' + this.offset + ' to ' + (this.offset + this.tableRows.length)
    );
  }

  public setUrl(urlIn: { url: string; auth: string }) {
    this.currentUrl = urlIn;
    this.refreshListOfTables();
  }

  public newDatabase(): void {
    const t = this;

    swal({
      title: 'Please enter a grest url, and JWT token',
      html: `<input id="url-input" placeholder=" postgrest url" class="swal2-input">
            <input id="auth-input" placeholder="JWT token" class="swal2-input">`,
      showCancelButton: true,
      confirmButtonText: 'Save',
      showLoaderOnConfirm: true,
      preConfirm: function() {
        return new Promise(function(resolve, reject) {
          if (!$('#url-input').val()) {
            reject('Nop!');
          } else {
            resolve({
              url: $('#url-input').val(),
              auth: $('#auth-input').val()
            });
          }
        });
      },
      allowOutsideClick: false
    }).then(function(db) {
      db.url = db.url.replace(/\/$/, ''); // remove trailing slash
      t.addUrl({ url: db.url, auth: db.auth });
    });
  }

  public addUrl(url: { url: string; auth: string }): void {
    // var url = prompt("Please enter your grest url:", "http://grest.something.com");
    if (url) {
      if (this.databaseUrls.length === 0) {
        this.currentUrl = url;
      }
      this.databaseUrls.push(url);
      this.persistUrls();
      this.refreshListOfTables();
    }
  }

  public newUrlButton(): void {
    if (this.databaseUrls.length === 0) {
      this.currentUrl = this.newUrl;
    }
    this.databaseUrls.push(this.newUrl);
    this.persistUrls();
    this.refreshListOfTables();
  }

  public persistUrls(): void {
    localStorage.setItem('databaseUrls', JSON.stringify(this.databaseUrls));
  }

  public deleteDB(): void {
    const newDB = this.databaseUrls.filter(
      value => value.url !== this.currentUrl.url
    );
    this.databaseUrls = newDB;
    if (newDB.length > 0) {
      this.currentUrl = newDB[0];
    } else {
      this.currentUrl = { url: '', auth: '' };
    }
    this.persistUrls();
    swal({
      title: 'Success',
      text: 'The database has been cleared',
      timer: 800,
      onOpen: function() {
        swal.showLoading();
      }
    });
  }

  public deleteAllDB(): void {
    localStorage.removeItem('databaseUrls');
    this.databaseUrls = [];
    this.tableRows = [];
    this.tableColumns = [];
    swal({
      title: 'Success',
      text: 'The database has been cleared',
      timer: 800,
      onOpen: function() {
        swal.showLoading();
      }
    });
  }

  public refreshListOfTables(): void {
    this.busy = true;
    this.busyMessage = this.MESSAGE_LOADING_TABLES;
    const theUrl: { url: string; auth: string } = this.currentUrl;
    this._postgrestService
      .fetchRows(theUrl, theUrl.url)
      .then(results => this.setTables(results));
  }

  public setTables(tables: { name: string; pkey: string }[]) {
    this.tables = tables;
    this.setTable(tables[0]);
  }

  public refreshTable(): void {
    this.setTable(this.table);
  }

  public setTable(table: { name: string; pkey: string }) {
    this.busy = true;
    this.busyMessage = this.MESSAGE_LOADING_ROWS;
    this.offset = 0;
    this.order = '';
    this.table = table;
    const theUrl = this.currentUrl.url + table.name;
    this.loadTableRows();
  }

  public loadTableRows() {
    let url = this.currentUrl.url + this.table.name;
    const startNum = this.offset;
    const rows = this.limit;
    const order = this.order;
    if (rows !== 0) {
      url = url + '?limit=' + rows + '&offset=' + startNum;
    }
    if (order) {
      url = url + '&order=' + order;
    }
    this._postgrestService
      .getRows(this.currentUrl, url)
      .then(res => this.showRows(res));
  }

  public next(): void {
    this.setBusy(true, this.MESSAGE_LOADING_ROWS);
    this.offset = this.offset + this.limit;
    this.loadTableRows();
  }

  public prev(): void {
    this.setBusy(true, this.MESSAGE_LOADING_ROWS);
    this.offset = this.offset - this.limit;

    if (this.offset < 0) {
      this.offset = 0;
    }
    this.loadTableRows();
  }

  public setOrder(col: string): void {
    let direction = '.asc';
    if (this.order.indexOf(col) > -1 && this.order.indexOf('.asc') > -1) {
      direction = '.desc';
    }
    this.setBusy(true, this.MESSAGE_LOADING_ROWS);
    this.order = col + direction;
    this.loadTableRows();
  }

  public showRows(blob: any) {
    this.tableColumns = [];

    const row: any = blob[0];
    for (const key in row) {
      if (row.hasOwnProperty(key)) {
        this.tableColumns.push(key);
      }
    }

    let count: number = this.offset;
    if (count === 0) {
      count = 1;
    }
    this.tableRows = [];
    for (const tableRow of blob) {
      const thisRow: any = {};
      for (const key in row) {
        if (tableRow.hasOwnProperty(key)) {
          Reflect.set(thisRow, key, tableRow[key]);
        }
      }
      count = count + 1;
      this.tableRows.push(thisRow);
    }

    const component = this;
    setTimeout(function() {
      component.setBusy(false, '');
    }, 800);

    // this.busyMessage = ""
    // this.busy = false;
  }

  public setBusy(val: boolean, msg: string) {
    this.busy = val;
    this.busyMessage = msg;
  }

  public edit(rowPassed: any, i: number): void {
    this.editing = true;
    this.tableRowToEdit = rowPassed;
    this.tableRowToEditOriginal = JSON.stringify(rowPassed);
  }

  public getTableRowToEdit(col: string): string {
    if (!col) {
      console.log('Not col!');
      return '';
    }
    if (!this.tableRowToEdit) {
      console.log('Not tableRowToEdit!');
      return '';
    }

    const test = this.tableRowToEdit[col];
    if (!test) {
      console.log('Not test!');
      return '';
    }

    return test;
  }

  public saveEdit(): void {
    this._postgrestService
      .doPatch(
        this.currentUrl,
        this.currentUrl.url +
          this.table.name +
          '?' +
          this.table.pkey +
          '=eq.' +
          this.tableRowToEdit[this.table.pkey],
        this.tableRowToEdit
      )
      .catch(error => console.log(error))
      .then(res => this.cancelEdit());
  }

  public cancelEdit(): void {
    this.editing = false;
  }

  public deleteRowButton(row: any): void {
    const t = this;
    swal({
      title: 'Are you sure?',
      text: 'You won\'t be able to revert this!',
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    })
      .then(function() {
        t.deleteRow(row);
      })
      .catch(function() {
        console.log('Cancelled');
      });
  }

  public deleteRow(row: any) {
    const t = this;
    this._postgrestService
      .doDelete(
        this.currentUrl,
        this.currentUrl.url +
          this.table.name +
          '?' +
          this.table.pkey +
          '=eq.' +
          row[this.table.pkey]
      )
      .catch(error => console.log(error))
      .then(v => t.refreshTable());
  }
}
