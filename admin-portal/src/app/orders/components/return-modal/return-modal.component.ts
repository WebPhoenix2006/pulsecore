import { Component, OnInit, OnDestroy, input, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { OrdersService } from '../../services/orders.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Order, ReturnRequest, ReturnItem } from '../../interfaces/order.interface';

@Component({
  selector: 'app-return-modal',
  standalone: false,
  templateUrl: './return-modal.component.html',
  styleUrls: ['./return-modal.component.scss']
})
export class ReturnModalComponent implements OnInit, OnDestroy {
  order = input.required<Order>();
  returnRequested = output<void>();
  close = output<void>();

  returnForm: FormGroup;
  isLoading = signal<boolean>(false);
  returnType = signal<string>('full'); // 'full' or 'partial'

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private ordersService: OrdersService,
    private toastService: ToastService
  ) {
    this.returnForm = this.createForm();
  }

  ngOnInit() {
    this.initializeForm();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createForm(): FormGroup {
    return this.fb.group({
      reason: ['', Validators.required],
      returnType: ['full'],
      items: this.fb.array([])
    });
  }

  get itemsArray(): FormArray {
    return this.returnForm.get('items') as FormArray;
  }

  initializeForm() {
    // Add all order items to the form for partial returns
    this.order().items.forEach(item => {
      const itemGroup = this.fb.group({
        orderItemId: [item.id],
        skuId: [item.skuId],
        skuName: [item.skuName || item.skuId],
        originalQuantity: [item.quantity],
        returnQuantity: [0, [Validators.min(0), Validators.max(item.quantity)]],
        reason: [''],
        selected: [false]
      });

      this.itemsArray.push(itemGroup);
    });
  }

  onReturnTypeChange() {
    const type = this.returnForm.get('returnType')?.value;
    this.returnType.set(type);

    if (type === 'full') {
      // Select all items and set return quantity to original quantity
      this.itemsArray.controls.forEach(control => {
        control.patchValue({
          selected: true,
          returnQuantity: control.get('originalQuantity')?.value
        });
      });
    } else {
      // Deselect all items and reset quantities
      this.itemsArray.controls.forEach(control => {
        control.patchValue({
          selected: false,
          returnQuantity: 0
        });
      });
    }
  }

  onItemSelectionChange(index: number) {
    const itemControl = this.itemsArray.at(index);
    const isSelected = itemControl.get('selected')?.value;

    if (isSelected) {
      // Set return quantity to original quantity when selected
      itemControl.patchValue({
        returnQuantity: itemControl.get('originalQuantity')?.value
      });
    } else {
      // Reset return quantity when deselected
      itemControl.patchValue({
        returnQuantity: 0
      });
    }
  }

  onQuantityChange(index: number) {
    const itemControl = this.itemsArray.at(index);
    const returnQuantity = itemControl.get('returnQuantity')?.value;

    // Automatically select/deselect based on quantity
    if (returnQuantity > 0) {
      itemControl.patchValue({ selected: true });
    } else {
      itemControl.patchValue({ selected: false });
    }
  }

  getSelectedItems(): any[] {
    return this.itemsArray.controls.filter(control =>
      control.get('selected')?.value && control.get('returnQuantity')?.value > 0
    );
  }

  getTotalReturnValue(): number {
    let total = 0;
    const selectedItems = this.getSelectedItems();

    selectedItems.forEach(control => {
      const returnQuantity = control.get('returnQuantity')?.value || 0;
      const skuId = control.get('skuId')?.value;
      const orderItem = this.order().items.find(item => item.skuId === skuId);

      if (orderItem) {
        total += returnQuantity * orderItem.unitPrice;
      }
    });

    return total;
  }

  isQuantityValid(index: number): boolean {
    const itemControl = this.itemsArray.at(index);
    const returnQuantity = itemControl.get('returnQuantity')?.value || 0;
    const originalQuantity = itemControl.get('originalQuantity')?.value || 0;

    return returnQuantity >= 0 && returnQuantity <= originalQuantity;
  }

  onSubmit() {
    if (this.returnForm.valid) {
      const selectedItems = this.getSelectedItems();

      if (selectedItems.length === 0) {
        this.toastService.showError('Please select at least one item to return');
        return;
      }

      this.isLoading.set(true);

      const returnItems: ReturnItem[] = selectedItems.map(control => ({
        orderItemId: control.get('orderItemId')?.value,
        quantity: control.get('returnQuantity')?.value,
        reason: control.get('reason')?.value || undefined
      }));

      const returnData: ReturnRequest = {
        orderId: this.order().id,
        reason: this.returnForm.get('reason')?.value,
        items: this.returnType() === 'partial' ? returnItems : undefined
      };

      this.ordersService.requestReturn(this.order().id, returnData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.returnRequested.emit();
            this.isLoading.set(false);
          },
          error: (error) => {
            this.toastService.showError('Failed to request return');
            this.isLoading.set(false);
          }
        });
    } else {
      this.toastService.showError('Please fill in all required fields');
    }
  }

  onClose() {
    this.close.emit();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  }
}