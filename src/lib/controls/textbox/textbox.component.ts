import {Component, EventEmitter, Input, OnInit, Optional, Output} from "@angular/core";
import {ControlValueAccessor, NgControl} from "@angular/forms";
import {CommonModule} from "@angular/common";
import {Observable} from "rxjs";
import {ObservableStringPipe} from "../../pipes/observable-string.pipe";
import {ChangeEventInterface} from "../../interfaces/change-event.interface";

@Component({
  selector: "ngy-textbox",
  standalone: true,
  templateUrl: "./textbox.component.html",
  imports: [
    ObservableStringPipe,
    CommonModule
  ],
  styleUrls: ["./textbox.component.scss"]
})
export class TextboxComponent implements OnInit, ControlValueAccessor {

  @Input() key!: string;

  @Input() id?: string = "";

  @Input() label?: string | Observable<string> = "";
  @Input() value?: any;


  @Input() inputType?: string = 'text';
  @Input() readonly?: boolean = false;
  @Input() disabled?: boolean = false;
  @Input() floating?: boolean = false;
  @Input() placeholder?: string;

  @Output() ngyChange = new EventEmitter<ChangeEventInterface>();
  @Output() ngyFocus = new EventEmitter<FocusEvent>();
  @Output() ngyBlur = new EventEmitter<FocusEvent>();
  @Output() ngyClick = new EventEmitter<MouseEvent>();
  @Output() ngyContextMenu = new EventEmitter<MouseEvent>();

  _val: any = null;

  constructor(@Optional() public control?: NgControl) {
    if (control)
      control.valueAccessor = this;
  }

  onChange: (value: any) => void = () => {
  };

  onTouched: () => void = () => {
  };

  ngOnInit(): void {
    if (this.value) {
      this._val = this.value;
    }
  }

  public registerOnChange(fn: (value: any | null) => void) {
    this.onChange = fn;
  }

  public registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this.disabled = isDisabled;
  }

  writeValue(obj: any) {
    this._val = obj;
  }

  valueChange($event: Event) {
    const target = $event.target as HTMLInputElement;
    if (!target) return;
    this._val = target.value;
    this.onChange(this._val);
    this.ngyChange?.emit({
      target: $event.target,
      originalEvent: $event,
      value: this._val,
      type: 'change'
    });
  }

}
