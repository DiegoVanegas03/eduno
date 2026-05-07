import { Component, input, model, computed, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type EditableFieldType = 'text' | 'email' | 'select' | 'textarea' | 'number';

@Component({
  selector: 'app-editable-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editable-field.component.html',
})
export class EditableFieldComponent {
  label = input.required<string>();
  type = input<EditableFieldType>('text');
  placeholder = input<string>('');
  options = input<{ label: string, value: any }[]>([]);
  disabled = input<boolean>(false);
  
  value = model<any>('');
  isEditable = model<boolean>(false);

  @ViewChild('inputElement') inputElement?: ElementRef;

  constructor() {
    effect(() => {
      if (this.isEditable() && this.inputElement) {
        setTimeout(() => {
          this.inputElement?.nativeElement.focus();
        });
      }
    });
  }

  activateEdit() {
    if (this.disabled()) return;
    if (!this.isEditable() && (this.type() === 'text' || this.type() === 'textarea')) {
      this.isEditable.set(true);
    }
  }

  displayValue = computed(() => {
    if (this.type() === 'select') {
      // Find the option that matches the current value and return its label
      const selectedOption = this.options().find(opt => String(opt.value) === String(this.value()));
      return selectedOption ? selectedOption.label : this.value();
    }
    return this.value();
  });
}
