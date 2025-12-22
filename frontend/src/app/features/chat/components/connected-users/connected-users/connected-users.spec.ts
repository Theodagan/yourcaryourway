import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectedUsers } from './connected-users';

describe('ConnectedUsers', () => {
  let component: ConnectedUsers;
  let fixture: ComponentFixture<ConnectedUsers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConnectedUsers]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConnectedUsers);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
