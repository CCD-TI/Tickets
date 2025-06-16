import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelTicketsComponent } from './panel-tickets.component';

describe('PanelTicketsComponent', () => {
  let component: PanelTicketsComponent;
  let fixture: ComponentFixture<PanelTicketsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelTicketsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PanelTicketsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
