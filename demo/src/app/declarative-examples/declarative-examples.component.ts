import {AfterViewInit, Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from "@angular/forms";
import {
  CheckboxComponent,
  HelperTextDirective,
  MultiCheckboxComponent,
  OptionComponent,
  SelectComponent,
  TextareaComponent,
  TextboxComponent,
  ValidatorMessageDirective
} from "dynamic-form";
import {codeExamples} from "../../code-examples";

declare const hljs: any;

@Component({
  selector: 'app-declarative-examples',
  standalone: true,
  imports: [CommonModule, FormsModule, TextboxComponent, ValidatorMessageDirective, HelperTextDirective, TextareaComponent, SelectComponent, OptionComponent, CheckboxComponent, MultiCheckboxComponent],
  templateUrl: './declarative-examples.component.html',
  styleUrls: ['./declarative-examples.component.scss']
})
export class DeclarativeExamplesComponent implements AfterViewInit {
  eventLog: any[] = [];

  //<editor-fold desc="Event test">
  eventTest(event: any) {
    if (this.eventLog.length > 100)
      this.eventLog.pop();
    const target = event.target as HTMLInputElement;
    this.eventLog.unshift({
      target: target ? target.tagName.toLowerCase() + '#' + target.getAttribute('name') : '---',
      type: event.type,
      value: event.value ?? (target ? target.value : '---')
    })
  }

  ngAfterViewInit(): void {
    hljs.highlightAll();
  }

  //</editor-fold>

  //<editor-fold desc="Fixtures">
  codeExamples = codeExamples;
  //</editor-fold>
}
