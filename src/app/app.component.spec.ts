import { TestBed, async } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import {PostgrestServiceService} from './services/postgrest-service.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, HttpClientTestingModule],
      providers: [PostgrestServiceService],
      declarations: [
        AppComponent
      ],
    }).compileComponents();
  }));

  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));

  it(`should have as title 'app'`, async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('app');
  }));

  it('should render #ng-postgrest div', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('#ng-postgrest').textContent).toBeTruthy();
  }));

});

describe('db', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, HttpClientTestingModule],
      providers: [PostgrestServiceService],
      declarations: [
        AppComponent
      ],
    }).compileComponents();
  }));

  it('should select the newly added db', async() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    const url1 = { url: 'https://localhost/1', auth: 'MyToken_1' };
    const url2 = { url: 'https://localhost/2', auth: 'MyToken_2' };
    app.addUrl(url1);
    app.addUrl(url2);
    expect(app.currentUrl).toEqual(url2);
  });

  it('should save new db to local storage', async() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    const url = { url: 'https://localhost', auth: 'MyToken' };
    app.addUrl(url);
    expect(window.localStorage.getItem('databaseUrls')).toEqual(JSON.stringify([url]));
  });

  it('should delete db from local storage', async() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    const url1 = { url: 'https://localhost/1', auth: 'MyToken_1' };
    const url2 = { url: 'https://localhost/2', auth: 'MyToken_2' };
    app.addUrl(url1);
    app.addUrl(url2);
    app.deleteDB(); // deletes the selected db, last one added
    expect(window.localStorage.getItem('databaseUrls')).toEqual(JSON.stringify([url1]));
  });

  it('should delete all db from local storage', async() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    const url1 = { url: 'https://localhost/1', auth: 'MyToken_1' };
    const url2 = { url: 'https://localhost/2', auth: 'MyToken_2' };
    app.addUrl(url1);
    app.addUrl(url2);
    app.deleteAllDB();
    expect(window.localStorage.getItem('databaseUrls')).toEqual(JSON.stringify([]));
  });

});
