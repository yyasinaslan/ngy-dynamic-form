import {
  AfterContentInit,
  AfterViewInit,
  Component,
  ContentChild,
  ContentChildren,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  ViewChild
} from "@angular/core";
import {ControlValueAccessor, NgControl} from "@angular/forms"
import {BehaviorSubject, combineLatest, map, Observable, of, Subscription} from "rxjs";
import {CommonModule} from "@angular/common";
import {ObservableStringPipe} from "../../pipes/observable-string.pipe";
import {DropdownOption} from "../../interfaces/dropdown-option.interface";
import {HelperTextDirective} from "../../directives/helper-text.directive";
import {ValidatorMessageDirective} from "../../directives/validator-message.directive";
import {OptionComponent} from "../../components/option/option.component";
import {createPopper, Instance} from "@popperjs/core";
import {ChangeEventInterface} from "../../interfaces/change-event.interface";

@Component({
  selector: "ngy-select",
  standalone: true,
  templateUrl: "./select.component.html",
  styleUrls: ["./select.component.scss"],
  imports: [
    ObservableStringPipe,
    CommonModule,
  ]
})
export class SelectComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit, AfterContentInit, ControlValueAccessor {
  //<editor-fold desc="Inputs">
  @Input() key!: string;

  @Input() id: string = "";

  @Input() label: string | Observable<string> = "";
  @Input() value?: any;

  @Input() multiple: boolean = false;

  @Input() type: string = 'text';

  // Clear button
  @Input() showClearButton: boolean = false;
  @Input() clearButtonText: string = 'Clear';

  @Input() readonly: boolean = false;
  @Input() disabled: boolean = false;
  @Input() floating: boolean = false;
  @Input() placeholder?: string;

  @Input() maxHeight: string = '75vh';

  @Input() options: DropdownOption[] | Observable<DropdownOption[]> = [];

  @Input() compareWith: (a: any, b: any) => boolean = (a: any, b: any) => {
    return a === b;
  };
  //</editor-fold>

  //<editor-fold desc="Outputs">
  @Output() ngyChange = new EventEmitter<ChangeEventInterface>();
  @Output() ngyFocus = new EventEmitter<FocusEvent>();
  @Output() ngyBlur = new EventEmitter<FocusEvent>();
  @Output() ngyClick = new EventEmitter<MouseEvent>();
  @Output() ngyContextMenu = new EventEmitter<MouseEvent>();
  //</editor-fold>

  @ContentChild(HelperTextDirective) helperTextTemplate?: HelperTextDirective;
  @ContentChildren(ValidatorMessageDirective) validatorsMessage!: QueryList<ValidatorMessageDirective>;
  @ContentChildren(OptionComponent) optionTags?: QueryList<OptionComponent>;
  private popperRef?: Instance;

  @HostListener('document:click', ['$event'])
  documentClick(event: MouseEvent) {
    const nativeEl = this.elRef.nativeElement as HTMLElement;
    if (!nativeEl.contains(event.target as HTMLElement)) {
      this.toggleDropdown(event, false);
    }
  }

  @ViewChild('dropdownToggle') dropdownToggle?: ElementRef<HTMLDivElement>;
  @ViewChild('dropdownMenu') dropdownMenu?: ElementRef<HTMLDivElement>;

  _options: DropdownOption[] = [];
  showDropdown: boolean = false;
  val: string[] | string = []; //seçili olan değer (checked)
  labels$: string | Observable<string> = new BehaviorSubject<string>('');
  optionLabelsSub?: Subscription;

  // Dropdown direction
  dropup: boolean = false;

  private optionSub?: Subscription;
  private optionTagsSub?: Subscription;

  constructor(public control: NgControl, private elRef: ElementRef) {
    control.valueAccessor = this;
  }

  //<editor-fold desc="Angular hooks">
  ngOnDestroy(): void {
    this.desubOptions();
    if (this.optionTagsSub) {
      this.optionTagsSub.unsubscribe();
    }

    if (this.popperRef) {
      this.popperRef.destroy();
    }
  }

  ngOnInit(): void {
    if (this.value) {
      this.val = this.value;
    }
    this.subOptions();
    this.calcLabels();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['input']) {
      this.desubOptions();
      this.subOptions();
    }
  }

  ngAfterContentInit(): void {
    if (this.optionTags) {
      this.handleOptionTags(this.optionTags);
      this.optionTagsSub = this.optionTags.changes.subscribe((optionTags) => {
        this.handleOptionTags(optionTags)
      })
    }

  }

  ngAfterViewInit(): void {
    if (!this.dropdownToggle || !this.dropdownMenu) return;

    this.popperRef = createPopper(this.dropdownToggle.nativeElement, this.dropdownMenu.nativeElement)
  }

  //</editor-fold>

  handleOptionTags(optionTags: QueryList<any>) {
    if (!optionTags || optionTags.length == 0) return;

    this.options = optionTags.map((optionComponent: OptionComponent) => ({
      label: optionComponent.label,
      value: optionComponent.value
    }))

    this.desubOptions();
    this.subOptions();
    this.calcLabels();
  }

  onChange: (value: any) => void = () => {
  };

  onTouched: () => void = () => {
  };

  async calcLabels() {
    const labels = await this.labels();

    this.labels$ = labels;
  }

  labels() {
    if (!Array.isArray(this.val)) {
      if (!this._options) return this.val;

      const opt = this._options.find((o) => this.compareWith(o.value, this.val));

      if (!opt) return this.val;

      return opt.label;
    }

    if (this.val === undefined) return "";

    if (!this._options || this._options.length == 0) return this.val.join(', ')

    const labels: Array<string | Observable<string>> = this.val.filter(v => {
      return this._options.find((o) => this.compareWith(o.value, v));
    }).map((v) => {
      const opt = this._options.find((o) => this.compareWith(o.value, v));
      if (!opt) return v;

      return opt.label;
    });

    if (labels.some(l => l instanceof Observable)) {
      return combineLatest(labels.map(l => l instanceof Observable ? l : of(l)))
        .pipe(
          map(labelsString => labelsString.join(', '))
        );
    }

    return labels.join(", ");
  }

  clickedControl(value: any, label: any) {
    this.val = value;
    this.onChange(this.val);
    this.showDropdown = false;
    this.calcLabels();

    this.ngyChange.emit({
      target: this.dropdownToggle!.nativeElement,
      value: this.val,
      type: 'change',
      originalEvent: null
    })
  }

  changeCheckControl(event: any, option: DropdownOption) {
    if (!this.multiple) return;

    if (!Array.isArray(this.val)) this.val = [this.val];

    const checked = event.target.checked;
    const checkValue = option.value;

    if (this.valIncludes(this.val, checkValue) && !checked) {
      const selected = this.val.filter(v => v != checkValue)
      this.val = this._options
        .filter(opt => this.valIncludes(selected, opt.value))
        .map(opt => opt.value);
    } else if (!this.valIncludes(this.val, checkValue) && checked) {
      this.val = this._options
        .filter(opt => this.valIncludes([...this.val, checkValue], opt.value))
        .map(opt => opt.value);
    }

    this.onChange(this.val);
    this.calcLabels();

    this.ngyChange.emit({
      target: this.dropdownToggle!.nativeElement,
      value: this.val,
      type: 'change',
      originalEvent: null
    })
  }

  public registerOnChange(fn: (value: any | null) => void): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  writeValue(obj: any): void {
    this.val = obj;
    this.calcLabels();
  }

  toggleDropdown(event: MouseEvent, state?: boolean) {
    if (this.control.disabled) {
      return;
    }

    this.showDropdown = state !== undefined ? state : !this.showDropdown;

    if (this.dropdownMenu) {
      if (this.showDropdown)
        this.dropdownMenu.nativeElement.classList.add('show');
      else
        this.dropdownMenu.nativeElement.classList.remove('show');

      if (this.popperRef) this.popperRef.update();
    }
  }

  /**
   * Returns true if selected array has value in it
   * @param arr
   * @param value
   */
  valIncludes(arr: Array<any>, value: any) {
    if (!Array.isArray(arr)) return false;
    return arr.findIndex(v => this.compareWith(v, value)) > -1;
  }


  subOptions() {
    if (this.options instanceof Observable) {
      this.optionSub = this.options.subscribe((options) => {
        this._options = options;
        this.calcLabels();
      });
      return;
    }

    this._options = this.options as DropdownOption[];
  }

  desubOptions() {
    if (this.options instanceof Observable && this.optionSub) {
      this.optionSub.unsubscribe();
    }
  }
}
