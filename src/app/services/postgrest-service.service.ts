import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable()
export class PostgrestServiceService {
  constructor(private http: HttpClient) {}

  public fetchRows(db: {url: string, auth: string}, url: string): Observable<{ name: string; pkey: string }[]> {
    const options = {
      headers: new HttpHeaders({
        'Content-type': 'application/json',
        Authorization: 'Bearer ' + db.auth
      })
    };
    return this.http
      .get<any>(url, options)
        .pipe(
            map(response => {
              const paths = response.paths;
              const definitions = response.definitions;
              const results: { name: string; pkey: string }[] = [];
              for (const item in paths) {
                if (item != '/' && item.indexOf('/rpc/') != 0) {
                  const name = item;
                  let pkey: string;
                  const sName = name.replace('/', '')
                  for (const prop in definitions[sName]['properties']) {
                    if (definitions[sName]['properties'][prop]['description'] && definitions[sName]['properties'][prop]['description'].indexOf('Primary Key')) {
                      pkey = prop;
                    }
                  }
                  const table: { name: string; pkey: string } = { name: name, pkey: pkey };
                  results.push(table);
                }
              }
              return results;
            }),
            catchError(this.handleError)
        )
  }

  public doPatch(db: {url: string, auth: string}, url: string, jsonPayload: string): Observable<string[]> {
    const options = {
      headers: new HttpHeaders({
        'Content-type': 'application/json',
        Authorization: 'Bearer ' + db.auth
      })
    };
    return this.http
      .patch(url, jsonPayload, options)
        .pipe(
            catchError(this.handleError)
        )
  }

  public doDelete(db: {url: string, auth: string}, url: string): Observable<string[]> {
    const options = {
      headers: new HttpHeaders({
        'Content-type': 'application/json',
        Authorization: 'Bearer ' + db.auth
      })
    };
    return this.http
      .delete(url, options)
        .pipe(
            catchError(this.handleError)
        )
  }

  private handleError(error: any): Promise<any> {
    return Promise.reject(error.message || error);
  }

  public getRows(db: {url: string, auth: string}, url: string): Observable<any> {
    const options = {
      headers: new HttpHeaders({
        'Content-type': 'application/json',
        Authorization: 'Bearer ' + db.auth
      })
    };
    return this.http
      .get<any>(url, options)
      .pipe(
        map(res => res),
        catchError(this.handleError)
      )
  }
}
